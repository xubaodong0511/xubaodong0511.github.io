(function() {
  var petalCount = 40;
  var petalContainer = document.createElement("div");
  petalContainer.style.position = "fixed";
  petalContainer.style.left = "0";
  petalContainer.style.top = "0";
  petalContainer.style.width = "100%";
  petalContainer.style.height = "100%";
  petalContainer.style.pointerEvents = "none";
  petalContainer.style.zIndex = "-1";
  if (document.body.firstChild) {
    document.body.insertBefore(petalContainer, document.body.firstChild);
  } else {
    document.body.appendChild(petalContainer);
  }

  function randomBetween(a, b) {
    return Math.random() * (b - a) + a;
  }

  // SVG 花瓣路径
  var petalSVG = [
    // 粉色花瓣
    `<svg width="24" height="24" viewBox="0 0 24 24" style="display:block" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2 C15 8, 22 10, 12 22 C2 10, 9 8, 12 2 Z" fill="#ffb7c5" />
    </svg>`,
    // 淡紫色花瓣
    `<svg width="24" height="24" viewBox="0 0 24 24" style="display:block" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2 C16 8, 22 12, 12 22 C2 12, 8 8, 12 2 Z" fill="#e0bbff" />
    </svg>`
  ];

  for (var i = 0; i < petalCount; i++) {
    var petal = document.createElement("span");
    petal.innerHTML = petalSVG[Math.floor(Math.random() * petalSVG.length)];
    var size = randomBetween(18, 36);
    petal.style.position = "absolute";
    petal.style.width = size + "px";
    petal.style.height = size + "px";
    petal.style.opacity = randomBetween(0.7, 1);
    petal.style.left = randomBetween(0, window.innerWidth) + "px";
    petal.style.top = randomBetween(-window.innerHeight, 0) + "px";
    petal.style.transition = "transform 0.3s";
    petalContainer.appendChild(petal);

    (function(petal, size) {
      var speed = randomBetween(0.8, 2);
      var drift = randomBetween(-1, 1.2);
      var rotate = randomBetween(-2, 2);
      function fall() {
        var top = parseFloat(petal.style.top);
        var left = parseFloat(petal.style.left);
        var deg = (parseFloat(petal.getAttribute("data-rotate")) || 0) + rotate;
        petal.style.transform = "rotate(" + deg + "deg)";
        petal.setAttribute("data-rotate", deg);
        if (top > window.innerHeight) {
          petal.style.top = randomBetween(-window.innerHeight, 0) + "px";
          petal.style.left = randomBetween(0, window.innerWidth) + "px";
        } else {
          petal.style.top = (top + speed) + "px";
          petal.style.left = (left + drift) + "px";
        }
        requestAnimationFrame(fall);
      }
      fall();
    })(petal, size);
  }
})();