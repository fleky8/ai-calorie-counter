// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Custom command to upload a file
Cypress.Commands.add('uploadFile', (selector, filePath, fileName, fileType = 'image/jpeg') => {
  cy.get(selector).then(subject => {
    cy.fixture(filePath, 'base64').then(content => {
      const el = subject[0];
      const blob = Cypress.Blob.base64StringToBlob(content, fileType);
      const file = new File([blob], fileName, { type: fileType });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      el.files = dataTransfer.files;
      cy.wrap(subject).trigger('change', { force: true });
    });
  });
});

// Custom command to wait for API response
Cypress.Commands.add('waitForApiResponse', (alias, timeout = 10000) => {
  cy.wait(alias, { timeout });
});

// Custom command to check accessibility
Cypress.Commands.add('checkA11y', (context, options) => {
  cy.injectAxe();
  cy.checkA11y(context, options);
});

// Custom command to simulate mobile viewport
Cypress.Commands.add('setMobileViewport', () => {
  cy.viewport(375, 667);
});

// Custom command to simulate desktop viewport
Cypress.Commands.add('setDesktopViewport', () => {
  cy.viewport(1280, 720);
});

// Custom command to clear local storage and session storage
Cypress.Commands.add('clearStorage', () => {
  cy.clearLocalStorage();
  cy.clearCookies();
  cy.window().then((win) => {
    win.sessionStorage.clear();
  });
});

// Custom command to mock API responses
Cypress.Commands.add('mockApiResponse', (method, url, response, statusCode = 200) => {
  cy.intercept(method, url, {
    statusCode,
    body: response
  });
});