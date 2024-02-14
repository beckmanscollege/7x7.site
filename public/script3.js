document.addEventListener("DOMContentLoaded", function () {
  // Get the menu, h1, and search input elements
  var menu = document.querySelector(".menu");
  var h1 = document.querySelector(".menu h1");
  var containers = document.querySelectorAll(".container");

  // Add an event listener for the click event on the menu
  menu.addEventListener("click", function () {
    // Toggle the 'active' class on the menu
    menu.classList.toggle("active");

    // Check if the menu is in the active state
    var isActive = menu.classList.contains("active");

    // Apply the appropriate classes and styles based on the menu state
    containers.forEach(function (container) {
      if (isActive) {
        container.classList.add("container-inactive");
        container.classList.remove("container-active");
      } else {
        container.classList.remove("container-inactive");
        container.classList.remove("container-active");
      }
    });

    // Toggle the 'menu-active' class for border styling
    menu.classList.toggle("menu-active", isActive);

    // Hide the placeholder text when the menu is active
    h1.textContent = isActive ? "" : "Overview";
  });

  // Add an event listener for input event on the search input
  document.querySelector(".menu [contenteditable]").addEventListener("input", function () {
    // Get the search input value
    var searchTerm = this.textContent.toLowerCase();

    // Apply the appropriate classes based on the search term
    containers.forEach(function (container) {
      var containerId = container.id.toLowerCase();
      if (searchTerm === containerId || containerId.includes(searchTerm)) {
        container.classList.remove("container-inactive");
        container.classList.add("container-active");
      } else {
        container.classList.add("container-inactive");
        container.classList.remove("container-active");
      }
    });
  });

  // Add an event listener for the click event on the document
  document.addEventListener("click", function (event) {
    // Check if the click is outside the menu
    if (!menu.contains(event.target)) {
      // Remove the 'active' class from the menu
      menu.classList.remove("active");

      // Remove the 'menu-active' class for border styling
      menu.classList.remove("menu-active");

      // Apply the 'container' class to all containers
      containers.forEach(function (container) {
        container.classList.remove("container-inactive");
        container.classList.remove("container-active");
      });

      // Apply the blur effect back to the container-wrapper
      document.querySelector(".container-wrapper").style.backdropFilter = "blur(2px)";
    }
  });
});
