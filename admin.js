(function () {
  'use strict';

  var data = MinsuData.load();

  var sideLinks = document.querySelectorAll('.side-link[data-view]');
  var views = document.querySelectorAll('.admin-view');

  function switchView(name) {
    sideLinks.forEach(function (l) { l.classList.toggle('active', l.dataset.view === name); });
    views.forEach(function (v) { v.classList.toggle('active', v.id === 'view-' + name); });
    if (name === 'dashboard') renderDashboard();
    if (name === 'properties') renderProperties();
    if (name === 'bookings') renderBookings();
  }

  sideLinks.forEach(function (l) {
    l.addEventListener('click', function () { switchView(l.dataset.view); });
  });

  document.getElementById('btnResetData').addEventListener('click', function () {
    if (!confirm('确定要重置成示例数据吗？这会清空你新增/修改的所有内容。')) return;
    data = MinsuData.reset();
    switchView('dashboard');
  });

  // ---------- Dashboard ----------
  function propertyName(id) {
    var p = data.properties.find(function (x) { return x.id === id; });
    return p ? p.name : '（已删除房源）';
  }

  function renderDashboard() {
    var pendingCount = data.bookings.filter(function (b) { return b.status === 'pending'; }).length;
    var confirmedCount = data.bookings.filter(function (b) { return b.status === 'confirmed'; }).length;

    var now = new Date();
    var ym = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    var monthRevenue = data.bookings
      .filter(function (b) { return b.status === 'confirmed' && b.checkIn.slice(0, 7) === ym; })
      .reduce(function (sum, b) {
        var p = data.properties.find(function (x) { return x.id === b.propertyId; });
        var price = p ? p.price : 0;
        return sum + price * MinsuData.nights(b.checkIn, b.checkOut);
      }, 0);

    var stats = [
      { label: '房源总数', value: data.properties.length },
      { label: '待确认订单', value: pendingCount },
      { label: '已确认订单', value: confirmedCount },
      { label: '本月确认收入', value: '¥' + monthRevenue },
    ];
    document.getElementById('statGrid').innerHTML = stats.map(function (s) {
      return '<div class="stat-card"><div class="num">' + s.value + '</div><div class="label">' + s.label + '</div></div>';
    }).join('');

    var recent = data.bookings.slice().sort(function (a, b) { return b.createdAt < a.createdAt ? -1 : 1; }).slice(0, 5);
    document.getElementById('recentBookingsBody').innerHTML = recent.map(function (b) {
      return '<tr><td>' + b.guestName + '</td><td>' + propertyName(b.propertyId) + '</td><td>' + b.checkIn + '</td>' +
        '<td><span class="badge ' + b.status + '">' + statusLabel(b.status) + '</span></td></tr>';
    }).join('') || '<tr><td colspan="4" style="color:var(--muted)">暂无订单</td></tr>';
  }

  function statusLabel(s) {
    return { pending: '待确认', confirmed: '已确认', cancelled: '已取消' }[s] || s;
  }

  // ---------- Properties ----------
  var propModalBackdrop = document.getElementById('propModalBackdrop');
  var propModalTitle = document.getElementById('propModalTitle');
  var propModalMsg = document.getElementById('propModalMsg');
  var propertyForm = document.getElementById('propertyForm');
  var propIdInput = document.getElementById('propIdInput');
  var propNameInput = document.getElementById('propNameInput');
  var propLocationInput = document.getElementById('propLocationInput');
  var propPriceInput = document.getElementById('propPriceInput');
  var propCapacityInput = document.getElementById('propCapacityInput');
  var propDescInput = document.getElementById('propDescInput');

  var PALETTE = ['linear-gradient(135deg,#F59E0B,#8B5CF6)', 'linear-gradient(135deg,#19B8D4,#3ED598)', 'linear-gradient(135deg,#EC4899,#7C3AED)', 'linear-gradient(135deg,#3ED598,#19B8D4)'];

  function renderProperties() {
    document.getElementById('propertiesBody').innerHTML = data.properties.map(function (p) {
      return '<tr><td>' + p.name + '</td><td>' + p.location + '</td><td>¥' + p.price + '</td><td>' + p.capacity + ' 人</td>' +
        '<td class="table-actions">' +
        '<button class="btn btn-sm" data-edit="' + p.id + '">编辑</button>' +
        '<button class="btn btn-sm btn-danger" data-delete="' + p.id + '">删除</button>' +
        '</td></tr>';
    }).join('') || '<tr><td colspan="5" style="color:var(--muted)">暂无房源</td></tr>';

    document.querySelectorAll('[data-edit]').forEach(function (btn) {
      btn.addEventListener('click', function () { openPropModal(btn.dataset.edit); });
    });
    document.querySelectorAll('[data-delete]').forEach(function (btn) {
      btn.addEventListener('click', function () { deleteProperty(btn.dataset.delete); });
    });
  }

  function openPropModal(id) {
    propModalMsg.innerHTML = '';
    propertyForm.reset();
    if (id) {
      var p = data.properties.find(function (x) { return x.id === id; });
      propModalTitle.textContent = '编辑房源';
      propIdInput.value = p.id;
      propNameInput.value = p.name;
      propLocationInput.value = p.location;
      propPriceInput.value = p.price;
      propCapacityInput.value = p.capacity;
      propDescInput.value = p.desc || '';
    } else {
      propModalTitle.textContent = '新增房源';
      propIdInput.value = '';
    }
    propModalBackdrop.classList.add('show');
  }

  document.getElementById('btnAddProperty').addEventListener('click', function () { openPropModal(null); });
  document.getElementById('btnClosePropModal').addEventListener('click', function () { propModalBackdrop.classList.remove('show'); });
  propModalBackdrop.addEventListener('click', function (e) { if (e.target === propModalBackdrop) propModalBackdrop.classList.remove('show'); });

  propertyForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = propNameInput.value.trim();
    var location = propLocationInput.value.trim();
    var price = parseFloat(propPriceInput.value);
    var capacity = parseInt(propCapacityInput.value, 10);
    if (!name || !location || !(price > 0) || !(capacity > 0)) {
      propModalMsg.innerHTML = '<div class="msg error">请完整填写所有必填项，价格和容纳人数需大于 0。</div>';
      return;
    }

    var id = propIdInput.value;
    if (id) {
      var p = data.properties.find(function (x) { return x.id === id; });
      p.name = name; p.location = location; p.price = price; p.capacity = capacity; p.desc = propDescInput.value.trim();
    } else {
      data.properties.push({
        id: MinsuData.uid('p'), name: name, location: location, price: price, capacity: capacity,
        desc: propDescInput.value.trim(), color: PALETTE[data.properties.length % PALETTE.length],
      });
    }
    MinsuData.save(data);
    propModalBackdrop.classList.remove('show');
    renderProperties();
  });

  function deleteProperty(id) {
    if (!confirm('确定删除这个房源吗？关联的订单记录会保留但会显示"已删除房源"。')) return;
    data.properties = data.properties.filter(function (p) { return p.id !== id; });
    MinsuData.save(data);
    renderProperties();
  }

  // ---------- Bookings ----------
  var currentFilter = 'all';
  document.querySelectorAll('#bookingFilters .filter-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      currentFilter = btn.dataset.status;
      document.querySelectorAll('#bookingFilters .filter-btn').forEach(function (b) { b.classList.toggle('active', b === btn); });
      renderBookings();
    });
  });

  function renderBookings() {
    var list = currentFilter === 'all' ? data.bookings : data.bookings.filter(function (b) { return b.status === currentFilter; });
    document.getElementById('bookingsBody').innerHTML = list.map(function (b) {
      var actions = '';
      if (b.status === 'pending') {
        actions = '<button class="btn btn-sm" data-confirm="' + b.id + '">确认</button> <button class="btn btn-sm btn-danger" data-cancel="' + b.id + '">取消</button>';
      } else if (b.status === 'confirmed') {
        actions = '<button class="btn btn-sm btn-danger" data-cancel="' + b.id + '">取消</button>';
      } else {
        actions = '<span style="color:var(--muted);font-size:12px">-</span>';
      }
      return '<tr><td>' + propertyName(b.propertyId) + '</td><td>' + b.guestName + '</td><td>' + b.checkIn + '</td><td>' + b.checkOut + '</td><td>' + b.guests + '</td>' +
        '<td><span class="badge ' + b.status + '">' + statusLabel(b.status) + '</span></td>' +
        '<td class="table-actions">' + actions + '</td></tr>';
    }).join('') || '<tr><td colspan="7" style="color:var(--muted)">暂无订单</td></tr>';

    document.querySelectorAll('[data-confirm]').forEach(function (btn) {
      btn.addEventListener('click', function () { setBookingStatus(btn.dataset.confirm, 'confirmed'); });
    });
    document.querySelectorAll('[data-cancel]').forEach(function (btn) {
      btn.addEventListener('click', function () { setBookingStatus(btn.dataset.cancel, 'cancelled'); });
    });
  }

  function setBookingStatus(id, status) {
    var b = data.bookings.find(function (x) { return x.id === id; });
    if (!b) return;
    b.status = status;
    MinsuData.save(data);
    renderBookings();
  }

  switchView('dashboard');
})();
