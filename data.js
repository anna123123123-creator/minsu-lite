(function (global) {
  'use strict';
  var STORAGE_KEY = 'minsu_lite_data_v1';

  function seed() {
    return {
      properties: [
        { id: 'p1', name: '山间原木小屋', location: '莫干山', price: 588, capacity: 4, desc: '独栋原木小屋，带私人庭院和篝火台，适合朋友小聚。', color: 'linear-gradient(135deg,#F59E0B,#8B5CF6)' },
        { id: 'p2', name: '海景日出公寓', location: '厦门', price: 428, capacity: 2, desc: '正对海湾的两居室公寓，步行 5 分钟到沙滩。', color: 'linear-gradient(135deg,#19B8D4,#3ED598)' },
        { id: 'p3', name: '老城青砖四合院', location: '北京', price: 968, capacity: 6, desc: '整租传统四合院，带天井和茶室，适合多人聚会。', color: 'linear-gradient(135deg,#EC4899,#7C3AED)' },
        { id: 'p4', name: '竹林禅意小院', location: '杭州', price: 358, capacity: 2, desc: '藏在竹林深处的小院，安静适合休养。', color: 'linear-gradient(135deg,#3ED598,#19B8D4)' },
      ],
      bookings: [
        { id: 'b1', propertyId: 'p1', guestName: '王先生', checkIn: '2026-09-10', checkOut: '2026-09-12', guests: 2, status: 'confirmed', createdAt: '2026-08-20' },
        { id: 'b2', propertyId: 'p2', guestName: '李女士', checkIn: '2026-09-15', checkOut: '2026-09-18', guests: 2, status: 'confirmed', createdAt: '2026-08-22' },
        { id: 'b3', propertyId: 'p3', guestName: '张先生', checkIn: '2026-09-20', checkOut: '2026-09-22', guests: 5, status: 'pending', createdAt: '2026-08-28' },
      ],
    };
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        var s = seed();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
        return s;
      }
      return JSON.parse(raw);
    } catch (e) {
      return seed();
    }
  }

  function save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function uid(prefix) {
    return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function dateOverlap(aStart, aEnd, bStart, bEnd) {
    return aStart < bEnd && bStart < aEnd;
  }

  function nights(checkIn, checkOut) {
    var ms = new Date(checkOut) - new Date(checkIn);
    return Math.round(ms / 86400000);
  }

  global.MinsuData = {
    load: load,
    save: save,
    uid: uid,
    dateOverlap: dateOverlap,
    nights: nights,
    reset: function () { var s = seed(); save(s); return s; },
  };
})(window);
