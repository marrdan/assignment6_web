
var icons = { phone: "📱", glasses: "👓", bag: "👜", cup: "☕", crumbs: "🍰" };

function toMinutes(time) {
  var parts = time.split(":");
  return Number(parts[0]) * 60 + Number(parts[1]);
}

// A simple round picture with the first letter. It is used only when the avatar link does not load.
function fallbackAvatar(name) {
  var hue = 0;
  for (var i = 0; i < name.length; i++) {
    hue = (hue * 31 + name.charCodeAt(i)) % 360;
  }
  var svg = "<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'>" +
    "<rect width='80' height='80' fill='hsl(" + hue + ",55%,78%)'/>" +
    "<text x='40' y='54' font-size='40' font-family='Arial' text-anchor='middle' fill='#333'>" +
    name.charAt(0) + "</text></svg>";
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

// ---------- Step 2: build one guest card ----------
function makeCard(guest) {
  var card = $("<div></div>");

  // data as classes
  card.addClass("guest");
  card.addClass("color-" + guest.color);
  if (guest.aitu) {
    card.addClass("aitu");
  } else {
    card.addClass("not-aitu");
  }

  // data as data-* attributes
  card.attr("data-name", guest.name);
  card.attr("data-color", guest.color);
  card.attr("data-time", guest.time);
  card.attr("data-minutes", toMinutes(guest.time));
  card.attr("data-aitu", guest.aitu ? "yes" : "no");
  card.attr("data-things", guest.things.join(" "));

  // what we see
  var avatar = $("<img class='avatar'>");
  avatar.on("error", function () {
    $(this).off("error").attr("src", fallbackAvatar(guest.name));
  });
  avatar.attr("src", "https://api.dicebear.com/9.x/open-peeps/svg?seed=" + guest.name);
  avatar.attr("alt", guest.name);
  card.append(avatar);

  if (guest.aitu) {
    card.append("<span class='badge'>🎓</span>");
  }

  card.append($("<div class='name'></div>").text(guest.name));
  card.append($("<div class='time'></div>").text("🕒 " + guest.time));

  var things = $("<div class='things'></div>");
  for (var i = 0; i < guest.things.length; i++) {
    card.addClass("has-" + guest.things[i]);
    things.append($("<span></span>").text(icons[guest.things[i]]));
  }
  card.append(things);

  return card;
}

// ---------- Step 2: build the whole house from the array ----------
function buildParty() {
  closeCardNow();
  $(".flyer").stop(true).remove();
  $("#house").empty();

  var floors = [2, 1];
  for (var f = 0; f < floors.length; f++) {
    var floor = $("<div class='floor'></div>");
    floor.attr("id", "floor-" + floors[f]);
    floor.append($("<div class='floor-label'></div>").text("FLOOR " + floors[f]));

    var rooms = $("<div class='rooms'></div>");
    for (var r = 0; r < party.length; r++) {
      var room = party[r];
      if (room.floor === floors[f]) {
        var roomDiv = $("<div class='room'></div>");
        roomDiv.attr("id", "room-" + room.key);
        roomDiv.attr("data-key", room.key);
        roomDiv.attr("data-sorted", "no");

        var head = $("<div class='room-head'></div>");
        head.append($("<h3></h3>").text(room.name));
        head.append($("<button class='sort-btn'>Sort by time</button>"));
        roomDiv.append(head);

        var guestsDiv = $("<div class='guests'></div>");
        for (var g = 0; g < room.guests.length; g++) {
          var card = makeCard(room.guests[g]);
          card.attr("data-order", g);   // place in the picture order
          guestsDiv.append(card);
        }
        roomDiv.append(guestsDiv);
        rooms.append(roomDiv);
      }
    }
    floor.append(rooms);
    $("#house").append(floor);
  }
}

// ---------- Step 4: the 20 cases ----------
// Every "find" function is ONE jQuery chain that searches the page (not the array).
var cases = [
  { title: "Who is in the hall?",
    find: function () {
      return $("#room-hall .guest");
    } },

  { title: "Who is dressed in yellow or purple?",
    find: function () {
      return $(".guest[data-color='yellow'], .guest[data-color='purple']");
    } },

  { title: "Which AITU students are upstairs?",
    find: function () {
      return $("#floor-2 .guest.aitu");
    } },

  { title: "Who has glasses or a bag?",
    find: function () {
      return $(".guest[data-things~='glasses'], .guest[data-things~='bag']");
    } },

  { title: "Who came with nothing at all?",
    find: function () {
      return $(".guest[data-things='']");
    } },

  { title: "Who has a phone but no bag?",
    find: function () {
      return $(".guest[data-things~='phone']").not("[data-things~='bag']");
    } },

  { title: "Who arrived between 20:30 and 21:00, both times included?",
    find: function () {
      // 20:30 = 1230 minutes, 21:00 = 1260 minutes
      return $(".guest").filter(function () {
        var minutes = $(this).data("minutes");
        return minutes >= 1230 && minutes <= 1260;
      });
    } },

  { title: "Who arrived after 21:00 and is not an AITU student?",
    find: function () {
      return $(".guest.not-aitu").filter(function () {
        return $(this).data("minutes") > 1260;
      });
    } },

  { title: "Who stands right next to Askar?",
    find: function () {
      // prev() = the guest on the left, the selector after add() = the guest on the right
      return $(".guest[data-name='Askar']").prev().add(".guest[data-name='Askar'] + .guest");
    } },

  { title: "Who stands last in each room?",
    find: function () {
      return $(".guest:last-child");
    } },

  { title: "Who stands third in each room?",
    find: function () {
      return $(".guest:nth-child(3)");
    } },

  { title: "Who stands after Timur in his room?",
    find: function () {
      return $(".guest[data-name='Timur']").nextAll();
    } },

  { title: "Who stands right before someone in black?",
    find: function () {
      return $(".guest[data-color='black']").prev();
    } },

  { title: "In which room is Aruzhan?",
    find: function () {
      return $(".guest[data-name='Aruzhan']").closest(".room");
    } },

  { title: "Which rooms have fewer than 6 guests?",
    find: function () {
      // a room has 6 guests when it has a 6th child. We want rooms WITHOUT it.
      return $(".room:not(:has(.guest:nth-child(6)))");
    } },

  { title: "In which rooms does somebody have a cup, but nobody wears glasses?",
    find: function () {
      return $(".room:has(.guest[data-things~='cup']):not(:has(.guest[data-things~='glasses']))");
    } },

  { title: "Who came first to each room?",
    find: function () {
      // a guest came first if none of his neighbours in the room came earlier
      return $(".guest").filter(function () {
        var minutes = $(this).data("minutes");
        return $(this).siblings().filter(function () {
          return $(this).data("minutes") < minutes;
        }).length === 0;
      });
    } },

  { label: "Miras comes at 21:20 and stands between Askar and Inkar",
    title: "Miras, an AITU student in blue, comes at 21:20 with his phone and joins Askar and Inkar, standing between them. Let him appear smoothly.",
    action: true,
    find: function () {
      var miras = { name: "Miras", color: "blue", time: "21:20", aitu: true, things: ["phone"] };
      return makeCard(miras).hide().insertAfter(".guest[data-name='Askar']").fadeIn(800, function () {
        jump($(this));
      });
    } },

  { label: "Natasha goes home",
    title: "Natasha says goodbye and goes home. Her card fades away and disappears from the page.",
    action: true,
    find: function () {
      return $(".guest[data-name='Natasha']").fadeOut(800, function () {
        $(this).remove();
      });
    } },

  { label: "Who took the cake?",
    title: "Who took the cake? (downstairs, came after 21:00 but before 21:30, has crumbs but no cup, stands right next to an AITU student)",
    find: function () {
      // downstairs, came after 21:00 and before 21:30 (1290), has crumbs but no cup,
      // and the left or the right neighbour is an AITU student
      return $("#floor-1 .guest[data-things~='crumbs']").not("[data-things~='cup']").filter(function () {
        var minutes = $(this).data("minutes");
        var nextToAitu = $(this).prev().is(".aitu") || $(this).next().is(".aitu");
        return minutes > 1260 && minutes < 1290 && nextToAitu;
      });
    } }
];

// ---------- Step 3: show the result ----------
function jump(guests) {
  guests.animate({ top: -14 }, 150).animate({ top: 0 }, 150);
}

function showResult(found) {
  var names;
  if (found.first().is(".room")) {
    names = found.find("h3").map(function () { return $(this).text(); }).get();
  } else {
    names = found.map(function () { return $(this).attr("data-name"); }).get();
  }
  $("#result").text("Found: " + found.length + " - " + names.join(", "));
}

// ---------- Effect 1: Spotlight ----------
function spotlight(found) {
  var bright;
  if (found.first().is(".room")) {
    bright = found.find(".guest");   // a case that finds rooms: guests of these rooms stay bright
  } else {
    bright = found;
  }
  var pale = $(".room .guest").not(bright);

  // stop("fx", true, true): finish the old fade at once and delete the waiting ones,
  // so fast clicks never build a queue
  pale.stop("fx", true, true).fadeTo(300, 0.2);
}

function clearSpotlight() {
  // stop(true) WITHOUT jumpToEnd, then top: 0 - a guest in the middle of his jump must not stay up
  $(".room .guest").stop("fx", true).css("top", 0).fadeTo(300, 1);
  $(".found").removeClass("found");
  $("#result").text("Cleared.");
}

function runCase(index) {
  buildParty();
  var found = cases[index].find();
  found.addClass("found");
  showResult(found);

  // the spotlight works for every case; the found guests (not rooms) jump once.
  // Miras jumps by himself after he has appeared, Natasha leaves, so she does not jump.
  if (found.length > 0) {
    spotlight(found);
    if (!cases[index].action && !found.first().is(".room")) {
      jump(found);
    }
  }
}

// ---------- Effect 2: Guest card ----------
var thingWords = { phone: "a phone", glasses: "glasses", bag: "a bag", cup: "a cup", crumbs: "cake crumbs" };

var currentCard = null;    // the open card (jQuery object) or null
var currentGuest = null;   // the guest that owns the open card

// "a phone and a bag"
function thingsText(things) {
  if (things === "") {
    return "Has nothing with them";
  }
  var list = things.split(" ");
  var words = [];
  for (var i = 0; i < list.length; i++) {
    words.push(thingWords[list[i]]);
  }
  var text = words[0];
  if (words.length > 1) {
    text = words.slice(0, -1).join(", ") + " and " + words[words.length - 1];
  }
  return "Has " + text;
}

function makeCardContent(guest) {
  var inner = $("<div class='card-inner'></div>");
  var room = guest.closest(".room");

  inner.append($("<h3></h3>").text(guest.attr("data-name")));
  inner.append($("<p></p>").text("Came at " + guest.attr("data-time")));
  inner.append($("<p></p>").text(guest.attr("data-aitu") === "yes" ? "AITU student" : "Not an AITU student"));
  inner.append($("<p></p>").text("Wears " + guest.attr("data-color")));
  inner.append($("<p></p>").text(thingsText(guest.attr("data-things"))));
  inner.append($("<p></p>").text("Now in the " + room.find("h3").text().toLowerCase()));

  // one button for every other room
  for (var i = 0; i < party.length; i++) {
    if (party[i].key !== room.attr("data-key")) {
      var button = $("<button class='move-btn'></button>");
      button.attr("data-room", party[i].key);
      button.text("Move to the " + party[i].name.toLowerCase());
      inner.append(button);
    }
  }
  return inner;
}

function openCard(guest) {
  closeCard();   // only one card can be open

  var avatar = guest.find(".avatar");
  var start = avatar.offset();
  var finalLeft = Math.max(10, Math.min(start.left, $(window).width() - 290));

  var card = $("<div id='info-card'></div>");
  card.append(makeCardContent(guest));
  // the card starts as small as the photo, on the photo
  card.css({ left: start.left, top: start.top, width: avatar.outerWidth(), height: avatar.outerHeight() });
  $("body").append(card);

  // and grows to the full size
  var fullHeight = card.children(".card-inner").outerHeight() + 6;   // + 2 borders of 3px
  card.animate({ left: finalLeft, top: start.top, width: 260, height: fullHeight }, 300);

  currentCard = card;
  currentGuest = guest;
}

// the card gets small again and goes back into the photo
function closeCard() {
  if (currentCard === null) {
    return;
  }
  var card = currentCard;
  var guest = currentGuest;
  currentCard = null;
  currentGuest = null;

  card.removeAttr("id");
  card.addClass("closing");

  var guestIsOnPage = $.contains(document.documentElement, guest[0]);
  if (!guestIsOnPage) {
    card.stop(true).remove();
    return;
  }
  var avatar = guest.find(".avatar");
  var end = avatar.offset();
  // stop(true): if the card is still growing, it turns back from where it is now
  card.stop(true).animate({ left: end.left, top: end.top, width: avatar.outerWidth(), height: avatar.outerHeight() }, 250, function () {
    $(this).remove();
  });
}

// remove the card at once, without animation
function closeCardNow() {
  if (currentCard !== null) {
    currentCard.stop(true).remove();
  }
  currentCard = null;
  currentGuest = null;
  $(".closing").stop(true).remove();
}

// ---------- Effect 3: Move a guest to another room ----------
var orderCounter = 1000;   // every moved guest gets a bigger number, so he is the last one

function moveInArray(name, roomKey) {
  var guestData = null;
  for (var r = 0; r < party.length; r++) {
    for (var g = 0; g < party[r].guests.length; g++) {
      if (party[r].guests[g].name === name) {
        guestData = party[r].guests[g];
        party[r].guests.splice(g, 1);   // take him out of the old room
      }
    }
  }
  for (var k = 0; k < party.length; k++) {
    if (party[k].key === roomKey) {
      party[k].guests.push(guestData);  // put him at the end of the new room
    }
  }
}

function moveGuest(guest, roomKey) {
  // 1. the array changes at once, so the cases always see the right party
  moveInArray(guest.attr("data-name"), roomKey);

  var box = $("#room-" + roomKey + " .guests");
  var width = guest.outerWidth(true);
  var height = guest.outerHeight(true);
  var gap = parseInt(guest.css("margin-left"), 10);
  var start = guest.offset();

  // 2. a copy of the guest flies, the real card waits outside the page
  var flyer = guest.clone();
  flyer.addClass("flyer");
  flyer.css({ position: "absolute", left: start.left, top: start.top, margin: 0, width: guest.outerWidth() });
  $("body").append(flyer);

  // 3. old room: an empty place stays and closes slowly
  var oldSpace = $("<div class='space'></div>").css({ width: width, height: height });
  oldSpace.data("w", 0);                   // this place will be 0 wide when it is closed
  oldSpace.insertBefore(guest);
  guest.detach();
  oldSpace.animate({ width: 0 }, 700, function () {
    $(this).remove();
  });

  // 4. new room: a place opens slowly at the end
  var newSpace = $("<div class='space'></div>").css({ width: 0, height: height });
  newSpace.data("w", width);               // the width this place will have when it is open
  box.append(newSpace);

  // for a moment put every place of this room at its FINAL width, only to read where the new place will be.
  // So even if other guests are moving now, the flyer lands on the right place.
  var spaces = box.children(".space");
  var nowWidths = spaces.map(function () { return $(this).width(); }).get();
  spaces.each(function () { $(this).css("width", $(this).data("w")); });
  var end = newSpace.offset();
  spaces.each(function (i) { $(this).css("width", nowWidths[i]); });
  newSpace.animate({ width: width }, 700);

  guest.attr("data-order", orderCounter);
  orderCounter++;

  // 5. the copy flies to the new place; then the real card takes the place
  flyer.animate({ left: end.left + gap, top: end.top + gap }, 700, function () {
    newSpace.stop(true);
    newSpace.replaceWith(guest);
    flyer.remove();
    $("#room-" + roomKey).attr("data-sorted", "no").find(".sort-btn").removeClass("active");
  });
}

// ---------- Effect 4: Sort the guests of a room by time ----------
function sortByTime(a, b) {
  return $(a).data("minutes") - $(b).data("minutes");
}

function sortByOrder(a, b) {
  return $(a).attr("data-order") - $(b).attr("data-order");
}

function sortRoom(room) {
  var box = room.children(".guests");
  var guests = box.children(".guest");
  var list = guests.get();

  // first click: sort by time, second click: back to the picture order
  if (room.attr("data-sorted") === "no") {
    list.sort(sortByTime);
    room.attr("data-sorted", "yes");
    room.find(".sort-btn").addClass("active");
  } else {
    list.sort(sortByOrder);
    room.attr("data-sorted", "no");
    room.find(".sort-btn").removeClass("active");
  }

  // stop all old animations of these guests (they stay where they are now)
  guests.stop("fx", true, true);
  guests.stop("move", true);

  // a. remember where every card is now
  var oldPlaces = [];
  guests.each(function (i) {
    oldPlaces[i] = $(this).offset();
  });

  // b. put the cards in the new order (they jump to the new places)
  guests.css({ left: 0, top: 0 });
  box.append(list);
  box.append(box.children(".space"));   // empty places stay at the end

  // c. move every card back to its OLD place with left/top, then slide to 0
  guests.each(function (i) {
    var newPlace = $(this).offset();
    $(this).css({ left: oldPlaces[i].left - newPlace.left, top: oldPlaces[i].top - newPlace.top });
  });
  guests.animate({ left: 0, top: 0 }, { duration: 700, queue: "move" }).dequeue("move");
}

// ---------- start ----------
$(function () {
  for (var i = 0; i < cases.length; i++) {
    var button = $("<button class='case-btn'></button>");
    button.text((i + 1) + ". " + (cases[i].label || cases[i].title));
    button.attr("title", cases[i].title);
    button.attr("data-index", i);
    $("#buttons").append(button);
  }
  $("#buttons").append("<button id='clear-btn' class='case-btn'>Clear</button>");

  $("#buttons").on("click", ".case-btn[data-index]", function () {
    runCase(Number($(this).attr("data-index")));
  });

  $("#clear-btn").on("click", clearSpotlight);

  // click on a guest: open his card (click on the same guest again: close it)
  $("#house").on("click", ".guest", function () {
    var guest = $(this);
    if (currentGuest !== null && currentGuest[0] === guest[0]) {
      closeCard();
    } else {
      openCard(guest);
    }
  });

  // click outside the card (and not on a guest): close the card
  $(document).on("click", function (event) {
    var inside = $(event.target).closest("#info-card, .guest").length > 0;
    if (!inside) {
      closeCard();
    }
  });

  // Esc: close the card
  $(document).on("keydown", function (event) {
    if (event.key === "Escape") {
      closeCard();
    }
  });

  // move buttons are inside the card
  $(document).on("click", ".move-btn", function () {
    var guest = currentGuest;
    if (guest === null) {
      return;
    }
    var roomKey = $(this).attr("data-room");
    closeCardNow();
    moveGuest(guest, roomKey);
  });

  // sort buttons
  $("#house").on("click", ".sort-btn", function () {
    sortRoom($(this).closest(".room"));
  });

  buildParty();
});
