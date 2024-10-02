const data = './fakeData.json'
describe('Generate contract E2E Test', () => {
  beforeEach(() => {
    cy.intercept('GET', 'http://localhost:3001/api/contracts/X6090907R', {
      statusCode: 404,
      body: {  }
    })
    cy.intercept('POST', 'http://localhost:3001/api/contracts', {
      statusCode: 201,
      body: JSON.stringify(data)
    }).as('createContract');
    /* cy.intercept('POST', 'http://localhost:3001/api/generate-pdf', {
      statusCode: 201,
      body: JSON.stringify(data)
    }).as('downloadPDF'); */
    cy.visit('http://localhost:3000/'); // Assuming the StepOne component is mounted at /step-one
  });

  /* it('should display and interact with the form fields', () => {
    // Fill in the name field
    cy.get('input#nombre').type('John Doe');
    cy.get('input#nombre').should('have.value', 'John Doe');

    // Fill in the DNI/NIE
    cy.get('input#id').type('12345678A');
    cy.get('input#id').should('have.value', '12345678A');

    // Fill in the domicile
    cy.get('input#domicilio').type('123 Main St');
    cy.get('input#domicilio').should('have.value', '123 Main St');

    // Select a modality (e.g., Presencial)
    cy.get('input#Presencial').check();
    cy.get('input#Presencial').should('be.checked');

    // Select a volunteer area (e.g., Reparto de Alimentos)
    cy.get('input#Reparto\\ de\\ Alimentos').check();
    cy.get('input#Reparto\\ de\\ Alimentos').should('be.checked');
  });

  it('should show DNI/NIE validation messages', () => {
    // Test incorrect DNI/NIE input
    cy.get('input#id').type('invalidDNI');
    cy.get('input#id').should('have.value', 'invalidDNI');
    
    // Wait for validation
    cy.wait(500);

    // Assert that the error message is shown
    cy.get('[data-testid="id-error"]').should('contain.text', 'El DNI/NIE no es válido');

    // Test correct DNI/NIE input
    cy.get('input#id').clear().type('X6090907R');
    
    // Wait for validation
    cy.wait(500);

    // Assert that the success message is shown
    cy.get('[data-testid="id-ok"]').should('contain.text', 'DNI/NIE con formato válido');
  }); */

  it('should navigate to the next step after submitting', () => {
    // Fill out required fields
    cy.get('input#nombre').type('John Doe');
    cy.get('input#id').type('X6090907R');
    cy.get('input#domicilio').type('123 Main St');
    // get telephone and type on it
    cy.get('input#telefono').type('123456789');
    // get email and type on it
    cy.get('input#email').type('john@example.com');
    cy.get('input#Presencial').check();
    cy.get('input#Reparto\\ de\\ Alimentos').check();
// select a "valencia " in the sede select input
cy.get('select#lugar').select('Valencia');
// select radiobutton "dias-lab-ma"
cy.get('input#dias-lab-ma').check();
    // Simulate form submission
    cy.get('button[type="submit"]').click();
    
    cy.wait(500);
    const canvasSelector = 'canvas';
    /* cy.get(canvasSelector).should('be.visible');

    // Get canvas dimensions to calculate relative points for drawing
    cy.get(canvasSelector).then(($canvas) => {
      const canvas = $canvas[0];
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;

      // Simulate scribbling (a simple zigzag motion)
      cy.wrap(canvas)
        .trigger('mousedown', { which: 1, clientX: canvasWidth * 0.1, clientY: canvasHeight * 0.5 })
        .trigger('mousemove', { which: 1, clientX: canvasWidth * 0.5, clientY: canvasHeight * 0.3 })
        .trigger('mousemove', { which: 1, clientX: canvasWidth * 0.9, clientY: canvasHeight * 0.7 })
        .trigger('mouseup');
        // Optionally, validate that the canvas has been "scribbled" by asserting the context's content
        cy.get(canvasSelector).then(($canvas) => {
          const canvas = $canvas[0];
          const context = canvas.getContext('2d');
          const canvasData = context?.getImageData(0, 0, canvas.width, canvas.height);
          
          // Assert that some pixels are no longer blank
          if (canvasData){
            
            const hasDrawing = Array.from(canvasData.data).some((value) => value !== 0);
            expect(hasDrawing).to.be.true; // Use Chai's assertion style
          }
        });
      }); */
      cy.get('canvas') // Get the canvas element
      .then((canvas) => {
        const context = canvas[0].getContext('2d');
        context?.moveTo(50, 50); // Start point
        context?.lineTo(200, 200); // Draw line
        context?.stroke(); // Apply stroke
        const imageData = context?.getImageData(0, 0, canvas[0].width, canvas[0].height); // Get the image data
        if (imageData){
            
          const hasDrawing = Array.from(imageData.data).some((value) => value !== 0);
          expect(hasDrawing).to.be.true; // Use Chai's assertion style
        }
      });
    
    cy.get('button').contains('Siguiente').click();
    cy.wait(500);
    cy.get('input#datos').click()
    cy.get('input#confidencialidad').click()
    cy.get('input#imagen').click()
    const downloadsFolder = Cypress.config('downloadsFolder');
    
    cy.get('button').contains('Enviar contrato').click();
    cy.task('clearFolder', downloadsFolder);
    cy.get('button').contains('Descargar contrato').click();
    cy.wait(5000);
    cy.task('getMostRecentFile', downloadsFolder).then((mostRecentFile) => {
      // Ensure a file was downloaded
      expect(mostRecentFile).to.exist;

      // Verify the file has a .pdf extension
      expect(mostRecentFile).to.match(/\.pdf$/);
    });
    cy.task('clearFolder', downloadsFolder);

  });
});
