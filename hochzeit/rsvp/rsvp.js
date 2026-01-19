/* ==========================================================================
   RSVP Page JavaScript
   ========================================================================== */

// DOM Elements
let rsvpForm;
let attendanceRadios;
let guestCountGroup;
let dietaryGroup;
let submitBtn;
let btnText;
let btnLoading;
let rsvpSuccessYes;
let rsvpSuccessNo;
let rsvpSuccessMaybe;

/**
 * Initialize the RSVP form
 */
function initRSVPForm() {
  rsvpForm = document.getElementById("rsvpForm");
  attendanceRadios = document.querySelectorAll(
    'input[name="entry.2071026655"]'
  );
  guestCountGroup = document.getElementById("guestCountGroup");
  dietaryGroup = document.getElementById("dietaryGroup");
  submitBtn = document.getElementById("submitBtn");
  btnText = document.querySelector(".btn-text");
  btnLoading = document.querySelector(".btn-loading");
  rsvpSuccessYes = document.getElementById("rsvpSuccessYes");
  rsvpSuccessNo = document.getElementById("rsvpSuccessNo");
  rsvpSuccessMaybe = document.getElementById("rsvpSuccessMaybe");

  // Show/hide additional fields based on attendance selection
  attendanceRadios.forEach((radio) => {
    radio.addEventListener("change", function () {
      if (this.value === "Ja, ich komme gerne!") {
        guestCountGroup.style.display = "block";
        dietaryGroup.style.display = "block";
      } else {
        guestCountGroup.style.display = "none";
        dietaryGroup.style.display = "none";
      }
    });
  });

  // Form submission handler
  rsvpForm.addEventListener("submit", handleFormSubmit);

  // Add additional validation
  rsvpForm.addEventListener("submit", function (e) {
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const attendance = getSelectedAttendance();

    if (!name || !email || !attendance) {
      e.preventDefault();
      alert("Bitte fülle alle Pflichtfelder aus.");
      return false;
    }

    // Log submission attempt for debugging
    console.log("RSVP submission attempt:", {
      name: name,
      email: email,
      attendance: attendance,
      timestamp: new Date().toISOString(),
    });
  });
}

/**
 * Get selected attendance value
 * @returns {string|null} The selected attendance value
 */
function getSelectedAttendance() {
  const selected = document.querySelector(
    'input[name="entry.2071026655"]:checked'
  );
  return selected ? selected.value : null;
}

/**
 * Handle form submission
 * @param {Event} e - The submit event
 */
function handleFormSubmit(e) {
  e.preventDefault(); // Prevent default form submission

  // Get attendance before anything else
  const attendance = getSelectedAttendance();

  // Show loading state
  submitBtn.disabled = true;
  btnText.style.display = "none";
  btnLoading.style.display = "inline-flex";

  // Collect form data
  const formData = new FormData();
  formData.append("entry.2114606884", document.getElementById("name").value); // Name
  formData.append("entry.2058424189", document.getElementById("email").value); // Email
  formData.append("entry.2071026655", attendance); // Attendance

  // Optional fields
  const guestCount = document.getElementById("guestCount").value;
  if (guestCount) {
    formData.append("entry.615218508", guestCount);
  }

  const dietary = document.getElementById("dietary").value;
  if (dietary) {
    formData.append("entry.1262614715", dietary);
  }

  const message = document.getElementById("message").value;
  if (message) {
    formData.append("entry.898837310", message);
  }

  // Google Forms URL
  const googleFormsURL =
    "https://docs.google.com/forms/d/e/1FAIpQLScSVOodADafzDHE8qC4RLEIpPF26f2ZwpO7cTJ1MlI7KigrYg/formResponse";

  // Submit to Google Forms using fetch
  fetch(googleFormsURL, {
    method: "POST",
    body: formData,
    mode: "no-cors", // Required for Google Forms
  })
    .then((response) => {
      // Note: With 'no-cors' mode, we can't read the actual response
      // But if the request completes without error, it was likely successful
      console.log("RSVP submission completed successfully");
      onSubmissionSuccess();
    })
    .catch((error) => {
      console.error("RSVP submission failed:", error);
      onSubmissionError(`Netzwerkfehler: ${error.message}`);
    });

  // Handle successful form submission
  function onSubmissionSuccess() {
    console.log("RSVP submission successful");

    // Hide form
    rsvpForm.style.display = "none";

    // Show appropriate success message
    if (attendance === "Ja, ich komme gerne!") {
      rsvpSuccessYes.style.display = "block";
      rsvpSuccessYes.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    } else if (attendance === "Nein, leider kann ich nicht") {
      rsvpSuccessNo.style.display = "block";
      rsvpSuccessNo.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    } else {
      rsvpSuccessMaybe.style.display = "block";
      rsvpSuccessMaybe.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }

    // Reset button state
    submitBtn.disabled = false;
    btnText.style.display = "inline";
    btnLoading.style.display = "none";
  }

  // Handle form submission error
  function onSubmissionError(errorMessage = "") {
    console.error("RSVP submission failed:", errorMessage);

    alert(
      `Entschuldigung, es gab einen Fehler beim Senden deiner Antwort. ${errorMessage}\n\nBitte versuche es nochmal oder kontaktiere uns direkt.`
    );

    // Reset button state
    submitBtn.disabled = false;
    btnText.style.display = "inline";
    btnLoading.style.display = "none";
  }
}

/**
 * Reset the form to initial state
 */
function resetForm() {
  rsvpForm.reset();
  guestCountGroup.style.display = "none";
  dietaryGroup.style.display = "none";
  rsvpForm.style.display = "block";
  rsvpSuccessYes.style.display = "none";
  rsvpSuccessNo.style.display = "none";
  rsvpSuccessMaybe.style.display = "none";
  rsvpForm.scrollIntoView({ behavior: "smooth", block: "center" });
}

/**
 * Download calendar event as ICS file
 */
function downloadCalendarEvent() {
  const event = {
    title: "Hochzeit Jan & Joana 💒",
    description:
      "Hochzeit von Jan Helfen & Joana Leipzig\n\nLocation: Bleckmanns Hof\nIm Alten Dorf 1\n59368 Werne\n\nWir freuen uns auf euch!",
    location: "Bleckmanns Hof, Im Alten Dorf 1, 59368 Werne",
    startDate: new Date("2026-05-16T14:00:00"),
    endDate: new Date("2026-05-17T02:00:00"),
  };

  // Format date for ICS (YYYYMMDDTHHMMSS)
  function formatDate(date) {
    return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  }

  // Create ICS content
  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Jan & Joana Hochzeit//DE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    "UID:" + Date.now() + "@hochzeit-jan-joana.de",
    "DTSTAMP:" + formatDate(new Date()),
    "DTSTART:20260516T140000",
    "DTEND:20260517T020000",
    "SUMMARY:" + event.title,
    "DESCRIPTION:" + event.description.replace(/\n/g, "\\n"),
    "LOCATION:" + event.location,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  // Create and download the file
  const blob = new Blob([icsContent], {
    type: "text/calendar;charset=utf-8",
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "Hochzeit_Jan_Joana_2026.ics";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", initRSVPForm);
