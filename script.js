(function () {
  'use strict';

  var propGrid = document.getElementById('propGrid');
  var modalBackdrop = document.getElementById('modalBackdrop');
  var btnCloseModal = document.getElementById('btnCloseModal');
  var modalPropName = document.getElementById('modalPropName');
  var modalPropLoc = document.getElementById('modalPropLoc');
  var bookedRanges = document.getElementById('bookedRanges');
  var modalMsg = document.getElementById('modalMsg');
  var bookingForm = document.getElementById('bookingForm');
  var guestNameInput = document.getElementById('guestNameInput');
  var checkInInput = document.getElementById('checkInInput');
  var checkOutInput = document.getElementById('checkOutInput');
  var guestsInput = document.getElementById('guestsInput');

  var data = MinsuData.load();
  var currentProperty = null;

  function renderGrid() {
    propGrid.innerHTML = data.properties.map(function (p) {
      return '<div class="prop-card" data-id="' + p.id + '">' +
        '<div class="prop-card__img" style="background:' + p.color + '"></div>' +
        '<div class="prop-card__body">' +
        '<h3>' + p.name + '</h3>' +
        '<div class="prop-card__loc">' + p.location + ' · 最多 ' + p.capacity + ' 人</div>' +
        '<div class="prop-card__price">¥' + p.price + ' <span>/ 晚</span></div>' +
        '</div></div>';
    }).join('');

    propGrid.querySelectorAll('.prop-card').forEach(function (card) {
      card.addEventListener('click', function () {
        openModal(card.dataset.id);
      });
    });
  }

  function confirmedBookingsFor(propertyId) {
    return data.bookings.filter(function (b) {
      return b.propertyId === propertyId && b.status === 'confirmed';
    });
  }

  function openModal(propertyId) {
    currentProperty = data.properties.find(function (p) { return p.id === propertyId; });
    if (!currentProperty) return;

    modalPropName.textContent = currentProperty.name;
    modalPropLoc.textContent = currentProperty.location + ' · ¥' + currentProperty.price + '/晚 · 最多 ' + currentProperty.capacity + ' 人';

    var booked = confirmedBookingsFor(propertyId);
    bookedRanges.innerHTML = '<strong>已被预订：</strong> ' + (booked.length
      ? booked.map(function (b) { return b.checkIn + ' 至 ' + b.checkOut; }).join('，')
      : '暂无，随时可订');

    modalMsg.innerHTML = '';
    bookingForm.reset();
    guestsInput.max = currentProperty.capacity;
    modalBackdrop.classList.add('show');
  }

  function closeModal() {
    modalBackdrop.classList.remove('show');
    currentProperty = null;
  }

  btnCloseModal.addEventListener('click', closeModal);
  modalBackdrop.addEventListener('click', function (e) {
    if (e.target === modalBackdrop) closeModal();
  });

  bookingForm.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!currentProperty) return;

    var name = guestNameInput.value.trim();
    var checkIn = checkInInput.value;
    var checkOut = checkOutInput.value;
    var guests = parseInt(guestsInput.value, 10);

    if (!name) return showMsg('请填写姓名。', true);
    if (!checkIn || !checkOut) return showMsg('请选择入住和离店日期。', true);
    if (checkOut <= checkIn) return showMsg('离店日期必须晚于入住日期。', true);
    if (guests > currentProperty.capacity) return showMsg('入住人数超过房源最大容纳人数（' + currentProperty.capacity + ' 人）。', true);

    var overlap = confirmedBookingsFor(currentProperty.id).some(function (b) {
      return MinsuData.dateOverlap(checkIn, checkOut, b.checkIn, b.checkOut);
    });
    if (overlap) return showMsg('这段日期已经被预订，请换个时间段。', true);

    var booking = {
      id: MinsuData.uid('b'),
      propertyId: currentProperty.id,
      guestName: name,
      checkIn: checkIn,
      checkOut: checkOut,
      guests: guests,
      status: 'pending',
      createdAt: new Date().toISOString().slice(0, 10),
    };
    data.bookings.push(booking);
    MinsuData.save(data);

    showMsg('预订申请已提交（待房东确认），共 ' + MinsuData.nights(checkIn, checkOut) + ' 晚。', false);
    bookingForm.reset();
  });

  function showMsg(text, isError) {
    modalMsg.innerHTML = '<div class="msg ' + (isError ? 'error' : 'success') + '">' + text + '</div>';
  }

  renderGrid();
})();
