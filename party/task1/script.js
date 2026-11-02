// ---------- small helper things ----------

var icons = { phone: "📱", glasses: "👓", bag: "👜", cup: "☕", crumbs: "🍰" };

// "21:15" -> 1275 (minutes from midnight). Numbers are easy to compare.
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
        roomDiv.append($("<h3></h3>").text(room.name));

        var guestsDiv = $("<div class='guests'></div>");
        for (var g = 0; g < room.guests.length; g++) {
          guestsDiv.append(makeCard(room.guests[g]));
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

function runCase(index) {
  buildParty();                       // build the page again before every case
  var found = cases[index].find();    // the jQuery chain
  found.addClass("found");            // highlight
  showResult(found);
  if (!cases[index].action && !found.first().is(".room")) {
    jump(found);                      // found guests jump once (rooms do not jump)
  }
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

  $("#buttons").on("click", ".case-btn", function () {
    runCase(Number($(this).attr("data-index")));
  });

  buildParty();
});
