(function () {
  // After deploying the Worker, paste its URL here (e.g. https://pixelprotech-chat.lindokuhlerojasmabika.workers.dev)
  var WORKER_URL = "https://pixelprotech-chat.lindokuhlerojasmabika.workers.dev";
  var WA = "https://wa.me/27651971461";
  var history = [];
  var busy = false;

  var launch = document.createElement("button");
  launch.className = "pc-launch";
  launch.type = "button";
  launch.setAttribute("aria-label", "Ask a question");
  launch.textContent = "Ask a question";

  var panel = document.createElement("div");
  panel.className = "pc-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "PixelProTech assistant");
  panel.innerHTML =
    '<div class="pc-head"><span>// ASK PIXELPROTECH</span><button class="pc-close" type="button" aria-label="Close">×</button></div>' +
    '<div class="pc-log" aria-live="polite"></div>' +
    '<form class="pc-form"><input type="text" maxlength="500" placeholder="Type your question…" aria-label="Your question"><button type="submit">Send</button></form>' +
    '<div class="pc-foot">AI assistant — answers may be wrong. For bookings and exact quotes use WhatsApp.</div>';

  document.body.appendChild(launch);
  document.body.appendChild(panel);

  var log = panel.querySelector(".pc-log");
  var form = panel.querySelector(".pc-form");
  var input = form.querySelector("input");
  var sendBtn = form.querySelector("button");

  function add(role, text) {
    var d = document.createElement("div");
    d.className = "pc-msg " + role;
    d.textContent = text;
    log.appendChild(d);
    log.scrollTop = log.scrollHeight;
    return d;
  }

  function greet() {
    add("bot", "Hi! Ask me about repairs, pricing, coverage or hardware. I'll keep it short.");
    var chips = document.createElement("div");
    chips.className = "pc-chips";
    ["How much is a visit?", "Do you come to Pretoria?", "Can you upgrade my laptop?"].forEach(function (q) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "pc-chip";
      b.textContent = q;
      b.onclick = function () { chips.remove(); ask(q); };
      chips.appendChild(b);
    });
    log.appendChild(chips);
  }

  function ask(q) {
    if (busy || !q) return;
    busy = true;
    sendBtn.disabled = true;
    add("me", q);
    history.push({ role: "user", content: q });
    var bot = add("bot", "…");
    var full = "";

    fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history.slice(-8) }),
    })
      .then(function (res) {
        if (!res.ok || !res.body) throw new Error("bad response");
        var reader = res.body.getReader();
        var dec = new TextDecoder();
        var buf = "";
        function pump() {
          return reader.read().then(function (r) {
            if (r.done) return;
            buf += dec.decode(r.value, { stream: true });
            var lines = buf.split("\n");
            buf = lines.pop();
            lines.forEach(function (line) {
              line = line.trim();
              if (line.indexOf("data:") !== 0) return;
              var data = line.slice(5).trim();
              if (data === "[DONE]") return;
              try {
                var j = JSON.parse(data);
                var t = j.choices && j.choices[0] && j.choices[0].delta && j.choices[0].delta.content;
                if (t) { full += t; bot.textContent = full; log.scrollTop = log.scrollHeight; }
              } catch (e) {}
            });
            return pump();
          });
        }
        return pump();
      })
      .then(function () {
        if (!full) throw new Error("empty");
        history.push({ role: "assistant", content: full });
      })
      .catch(function () {
        bot.textContent = "Sorry, I couldn't answer just now. Please message us on WhatsApp: " + WA;
        history.pop();
      })
      .then(function () {
        busy = false;
        sendBtn.disabled = false;
        input.focus();
      });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var q = input.value.trim();
    if (!q) return;
    input.value = "";
    ask(q);
  });

  function toggle(open) {
    panel.classList.toggle("open", open);
    if (open) {
      if (!log.children.length) greet();
      input.focus();
    }
  }
  launch.onclick = function () { toggle(!panel.classList.contains("open")); };
  panel.querySelector(".pc-close").onclick = function () { toggle(false); };
})();
