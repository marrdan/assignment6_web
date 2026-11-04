
var icons = { phone: "📱", glasses: "👓", bag: "👜", cup: "☕", crumbs: "🍰" };

function toMinutes(time) {
  var parts = time.split(":");
  return Number(parts[0]) * 60 + Number(parts[1]);
}


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


function makeCard(guest) {
  var card = $("<div></div>");


  card.addClass("guest");
  card.addClass("color-" + guest.color);
  if (guest.aitu) {
    card.addClass("aitu");
  } else {
    card.addClass("not-aitu");
  }

  
  card.attr("data-name", guest.name);
  card.attr("data-color", guest.color);
  card.attr("data-time", guest.time);
  card.attr("data-minutes", toMinutes(guest.time));
  card.attr("data-aitu", guest.aitu ? "yes" : "no");
  card.attr("data-things", guest.things.join(" "));


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
          card.attr("data-order", g);
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


// cases
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
      return $(".room:not(:has(.guest:nth-child(6)))");
    } },

  { title: "In which rooms does somebody have a cup, but nobody wears glasses?",
    find: function () {
      return $(".room:has(.guest[data-things~='cup']):not(:has(.guest[data-things~='glasses']))");
    } },

  { title: "Who came first to each room?",
    find: function () {
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
      return $("#floor-1 .guest[data-things~='crumbs']").not("[data-things~='cup']").filter(function () {
        var minutes = $(this).data("minutes");
        var nextToAitu = $(this).prev().is(".aitu") || $(this).next().is(".aitu");
        return minutes > 1260 && minutes < 1290 && nextToAitu;
      });
    } }
];


function jump(guests) {
  guests.stop(true).css("top", 0);
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



function spotlight(found) {
  var bright;
  if (found.first().is(".room")) {
    bright = found.find(".guest");
  } else {
    bright = found;
  }
  var pale = $(".room .guest").not(bright);

  bright.stop(true).fadeTo(300, 1);
  pale.stop(true).fadeTo(300, 0.2);
}

function clearSpotlight() {
 
  $(".room .guest").stop("fx", true).css("top", 0).fadeTo(300, 1);
  $(".found").removeClass("found");
  $("#result").text("Cleared.");
}

function runCase(index) {
  buildParty();
  var found = cases[index].find();
  found.addClass("found");
  showResult(found);

  
  if (found.length > 0) {
    spotlight(found);
    if (!cases[index].action && !found.first().is(".room")) {
      jump(found);
    }
  }
}


//guest info card
var thingWords = { phone: "a phone", glasses: "glasses", bag: "a bag", cup: "a cup", crumbs: "cake crumbs" };

var currentCard = null;  
var currentGuest = null;


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
  closeCard();

  var avatar = guest.find(".avatar");
  var start = avatar.offset();
  var finalLeft = Math.max(10, Math.min(start.left, $(window).width() - 290));

  var card = $("<div id='info-card'></div>");
  card.append(makeCardContent(guest));
  
  card.css({ left: start.left, top: start.top, width: avatar.outerWidth(), height: avatar.outerHeight() });
  $("body").append(card);

 
  var fullHeight = card.children(".card-inner").outerHeight() + 6;   
  card.animate({ left: finalLeft, top: start.top, width: 260, height: fullHeight }, 300);

  currentCard = card;
  currentGuest = guest;
}


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
  card.stop(true).animate({ left: end.left, top: end.top, width: avatar.outerWidth(), height: avatar.outerHeight() }, 250, function () {
    $(this).remove();
  });
}


function closeCardNow() {
  if (currentCard !== null) {
    currentCard.stop(true).remove();
  }
  currentCard = null;
  currentGuest = null;
  $(".closing").stop(true).remove();
}

//move another guest to another room effect 3
var orderCounter = 1000;

function moveInArray(name, roomKey) {
  var guestData = null;
  for (var r = 0; r < party.length; r++) {
    for (var g = 0; g < party[r].guests.length; g++) {
      if (party[r].guests[g].name === name) {
        guestData = party[r].guests[g];
        party[r].guests.splice(g, 1);  
      }
    }
  }
  for (var k = 0; k < party.length; k++) {
    if (party[k].key === roomKey) {
      party[k].guests.push(guestData); 
    }
  }
}

function moveGuest(guest, roomKey) {
  moveInArray(guest.attr("data-name"), roomKey);

  var box = $("#room-" + roomKey + " .guests");
  var width = guest.outerWidth(true);
  var height = guest.outerHeight(true);
  var gap = parseInt(guest.css("margin-left"), 10);
  var start = guest.offset();

  
  var flyer = guest.clone();
  flyer.addClass("flyer");
  flyer.css({ position: "absolute", left: start.left, top: start.top, margin: 0, width: guest.outerWidth() });
  $("body").append(flyer);

  
  var oldSpace = $("<div class='space'></div>").css({ width: width, height: height });
  oldSpace.data("w", 0);                  
  oldSpace.insertBefore(guest);
  guest.detach();
  oldSpace.animate({ width: 0 }, 700, function () {
    $(this).remove();
  });


  var newSpace = $("<div class='space'></div>").css({ width: 0, height: height });
  newSpace.data("w", width);
  box.append(newSpace);



  var spaces = box.children(".space");
  var nowWidths = spaces.map(function () { return $(this).width(); }).get();
  spaces.each(function () { $(this).css("width", $(this).data("w")); });
  var end = newSpace.offset();
  spaces.each(function (i) { $(this).css("width", nowWidths[i]); });
  newSpace.animate({ width: width }, 700);

  guest.attr("data-order", orderCounter);
  orderCounter++;



  flyer.animate({ left: end.left + gap, top: end.top + gap }, 700, function () {
    newSpace.stop(true);
    newSpace.replaceWith(guest);
    flyer.remove();
    $("#room-" + roomKey).attr("data-sorted", "no").find(".sort-btn").removeClass("active");
  });
}

// effect 4 
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


  if (room.attr("data-sorted") === "no") {
    list.sort(sortByTime);
    room.attr("data-sorted", "yes");
    room.find(".sort-btn").addClass("active");
  } else {
    list.sort(sortByOrder);
    room.attr("data-sorted", "no");
    room.find(".sort-btn").removeClass("active");
  }


  guests.stop("fx", true, true);
  guests.stop("move", true);


  var oldPlaces = [];
  guests.each(function (i) {
    oldPlaces[i] = $(this).offset();
  });


  guests.css({ left: 0, top: 0 });
  box.append(list);
  box.append(box.children(".space"));

  guests.each(function (i) {
    var newPlace = $(this).offset();
    $(this).css({ left: oldPlaces[i].left - newPlace.left, top: oldPlaces[i].top - newPlace.top });
  });
  guests.animate({ left: 0, top: 0 }, { duration: 700, queue: "move" }).dequeue("move");
}


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


  $("#house").on("click", ".guest", function () {
    var guest = $(this);
    if (currentGuest !== null && currentGuest[0] === guest[0]) {
      closeCard();
    } else {
      openCard(guest);
    }
  });


  $(document).on("click", function (event) {
    var inside = $(event.target).closest("#info-card, .guest").length > 0;
    if (!inside) {
      closeCard();
    }
  });


  $(document).on("keydown", function (event) {
    if (event.key === "Escape") {
      closeCard();
    }
  });

  $(document).on("click", ".move-btn", function () {
    var guest = currentGuest;
    if (guest === null) {
      return;
    }
    var roomKey = $(this).attr("data-room");
    closeCardNow();
    moveGuest(guest, roomKey);
  });


  $("#house").on("click", ".sort-btn", function () {
    sortRoom($(this).closest(".room"));
  });

  buildParty();
});
