let currentWord = {};
let words = [];
let initialSelectionState = false;
let isDragging = false;

document.addEventListener("DOMContentLoaded", function () {
  const gridItems = document.querySelectorAll(".game-container .gridItem");
  const shapeButtons = document.querySelectorAll(".shapeButton");
  const colorButtons = document.querySelectorAll(".colorButton");
  const grid = document.querySelector(".grid");

  function toggleSelect(event) {
    event.classList.toggle("selected");
  }

  gridItems.forEach((items) => {
    items.addEventListener("mousedown", handleMouseDown);
    items.addEventListener("mousemove", handleMouseMove);
    items.addEventListener("mouseup", handleMouseUp);
  });

  shapeButtons.forEach((items) => {
    items.addEventListener("click", function () {
      handleShapeButtonClick(this);
    });
  });

  colorButtons.forEach((items) => {
    items.addEventListener("click", function () {
      handleColorPaletteClick(this);
    });
  });

  window.addEventListener("click", function (e) {
    const clickedOnBodyOrMain =
      e.target.tagName == "BODY" || e.target.tagName == "MAIN";
    if (!grid.contains(e.target) && clickedOnBodyOrMain) {
      console.log(clickedOnBodyOrMain);
      console.log("otanför");
      clearSelections();
    }
  });

  shuffleWord();
});

function resetGrid() {
  if (!confirm("Are you sure you want to reset the grid?")) return;
  const gridItems = document.querySelectorAll(".game-container .gridItem");
  gridItems.forEach((gridItem) => {
     gridItem.classList.forEach((className) => {
      if (className.startsWith("color-")) {
        gridItem.classList.remove(className);
      }
    });
    gridItem.classList.add(`color-lightgray`);
    gridItem
      .querySelectorAll(".triangle, .circle, .square")
      .forEach((element) => {
        if (element.classList.contains("circle")) {
          element.classList.remove("hidden");
        } else {
          element.classList.add("hidden");
        }
      });
  });
  clearSelections();
}

function saveGrid() {
  console.log("saving...");
  const data = [];
  const gridItems = document.querySelectorAll(".game-container .gridItem");
  gridItems.forEach((gridItem) => {
    const row = gridItem.style.getPropertyValue("grid-row-start");
    const column = gridItem.style.getPropertyValue("grid-column-start");

    const color = Array.from(gridItem.classList)
      .find((className) => className.startsWith("color-"))
      .slice(6);

    let shape = "";
    gridItem
      .querySelectorAll(".triangle, .circle, .square")
      .forEach((element) => {
        if (!element.classList.contains("hidden")) {
          shape = element.classList[0];
        }
      });

    data.push({ row, column, color, shape });
  });

  // TODO: Make wordId dynamic
  const finalData = {
    gridData: data,
    wordId: currentWord.id,
  };

  fetch("/saveGrid", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(finalData),
  })
    .then((response) => {
      if (response.ok) {
        console.log("Data successfully saved.");
        // Display success message
        alert("Data successfully saved.");
      } else {
        console.error("Failed to save data:", response.statusText);
        // Display error message
        alert("Failed to save data.");
      }
    })
    .catch((error) => {
      console.error("Error saving data:", error);
      // Display error message
      alert("An error occurred while saving data.");
    });
}

function handleShapeButtonClick(button) {
  const shape = button.id.substr(6); // Extract shape from button ID (buttonCircle, buttonSquare, buttonTriangle)
  applyShape(shape);
}

function applyShape(shape) {
  document.querySelectorAll(".gridItem.selected").forEach((gridItem) => {
    gridItem.querySelectorAll("*").forEach((child) => {
      child.classList.add("hidden");
    });

    // Show children with the specified shape class
    const selectedShape = gridItem.querySelector(`.${shape}`);
    console.log(shape);
    console.log(selectedShape);
    if (selectedShape) {
      selectedShape.classList.remove("hidden");
    }
  });
}

function handleColorPaletteClick(button) {
  const color = button.getAttribute("data-color");
  applyColor(color);
}

function applyColor(color) {
  document.querySelectorAll(".gridItem.selected").forEach((element) => {
    element.classList.forEach((className) => {
      if (className.startsWith("color-")) {
        element.classList.remove(className);
      }
    });
    element.classList.add(`color-${color}`);
  });
}

function shuffleWord() {
  if (!words.length > 0) return;
  const newWord = words[Math.floor(Math.random() * words.length)];
  if (currentWord.id == newWord.id) {
    shuffleWord();
  } else {
    currentWord = newWord;
    const wordContainer = document.getElementById("word-container");
    wordContainer.innerHTML = currentWord.name;
  }
}

// Drag and select functionallity

function clearSelections() {
  document.querySelectorAll(".selected").forEach((element) => {
    element.classList.remove("selected");
  });
}

function handleMouseDown(event) {
  const gridItem = event.srcElement.parentElement;
  if (gridItem.classList.contains("grid")) return;
  initialSelectionState = gridItem.classList.contains("selected");
  isDragging = true;
  handleGridItemClick(gridItem);
}
function handleMouseMove(event) {
  if (isDragging) {
    const gridItem = event.srcElement.parentElement;
    if (gridItem.classList.contains("grid")) return;
    handleGridItemClick(gridItem);
  }
}

function handleMouseUp(event) {
  isDragging = false;
}

function handleGridItemClick(element) {
  if (initialSelectionState === element.classList.contains("selected")) {
    element.classList.toggle("selected");
  }
}
