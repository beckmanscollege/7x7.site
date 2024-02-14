document.addEventListener("DOMContentLoaded", function () {
  const circles = document.querySelectorAll(".circle");
  const colorPalettes1 = document.querySelectorAll(
    ".palette1 div:not(.button)"
  );
  const colorPalettes2 = document.querySelectorAll(
    ".palette2 div:not(.button)"
  );
  const clearButton = document.getElementById("buttonX");

  let selectedColor = "lightgray";
  let initialSelectionState = false;
  let isDragging = false;

  function handleShapeButtonClick(event) {
    const target = event.target;
    const shapeButton = target.closest(".button");

    if (shapeButton) {
      const shape = shapeButton.id.substr(6); // Extract shape from button ID (buttonCircle, buttonSquare, buttonTriangle)
      applyShape(shape);
    }
  }

  function applyShape(shape) {
    document.querySelectorAll(".circle.selected").forEach((element) => {
      element.className = `${shape} selected`;
    });
  }

  function applyColor(element) {
    element.style.backgroundColor = selectedColor;
  }

  function clearSelections() {
    document.querySelectorAll(".selected").forEach((element) => {
      element.classList.remove("selected");
    });
  }

  function handleMouseDown(event) {
    if (event.button === 0) {
      const target = event.target;
      if (target.classList.contains("circle")) {
        initialSelectionState = target.classList.contains("selected");
        isDragging = true;
        handleShapeClick(target);
      } else {
        clearSelections();
      }
    }
  }

  function handleMouseMove(event) {
    if (isDragging) {
      const target = document.elementFromPoint(event.clientX, event.clientY);
      if (target && target.classList.contains("circle")) {
        handleShapeClick(target);
      }
    }
  }

  function handleMouseUp(event) {
    if (event.button === 0) {
      isDragging = false;
    }
  }

  function handleShapeClick(element) {
    if (initialSelectionState === element.classList.contains("selected")) {
      // If the initial and current states are the same, toggle the selection
      element.classList.toggle("selected");
    }
  }

  function handleColorPaletteClick(event) {
    const target = event.target;
    const paletteItem = target.closest(
      ".palette1 div:not(.button), .palette2 div:not(.button)"
    );

    if (paletteItem) {
      const isCircleSelected = document.querySelector(".circle.selected");
      selectedColor = getComputedStyle(paletteItem).backgroundColor;

      if (!isCircleSelected) {
        document
          .querySelectorAll(
            `.circle[style*="background-color: ${selectedColor}"]`
          )
          .forEach((element) => {
            element.classList.add("selected");
          });
      } else {
        document.querySelectorAll(".selected").forEach((element) => {
          applyColor(element);
        });
      }
    }
  }

  circles.forEach((circle) => {
    circle.addEventListener("mousedown", handleMouseDown);
    circle.addEventListener("mousemove", handleMouseMove);
    circle.addEventListener("mouseup", handleMouseUp);
    circle.addEventListener("click", function () {
      handleColorPaletteClick.call(this);
    });
  });

  colorPalettes1.forEach((palette) => {
    palette.addEventListener("click", handleColorPaletteClick);
  });

  colorPalettes2.forEach((palette) => {
    palette.addEventListener("click", handleColorPaletteClick);
  });

  document
    .querySelector(".palette2")
    .addEventListener("click", handleShapeButtonClick);

  clearButton.addEventListener("click", clearSelections);

  // Clear selections when clicking elsewhere on the body
  document.body.addEventListener("mousedown", function (event) {
    const target = event.target;
    const isPalette1 = target.closest(".palette1");
    const isPalette2 = target.closest(".palette2");

    if (
      !target.classList.contains("circle") &&
      !isPalette1 &&
      !isPalette2 &&
      !target.classList.contains("button")
    ) {
      clearSelections();
      isDragging = false;
    }
  });
});
