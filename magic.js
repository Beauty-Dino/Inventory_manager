document.querySelector('.sku').addEventListener('input', function() {

    const skuValue = this.value;

    // Fetch item details based on SKU from the backend
    fetch(`http://localhost:3000/findname/${skuValue}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert('This is an invalid SKU number. Make sure that the item is in the database or the SKU number is inserted correctly');
            } else {
                // Populate the 'name' and 'quantity' fields
                this.dataset.itemId = data.itemDetails.id; // Save the item_id to the dataset
                document.getElementById('name').value = data.itemDetails.item_variation_data.name;
                document.getElementById('current-quantity').value = data.quantityDetails;
                
                // Render new input fields for the next item
                renderNewInputFields();
            }
        })
        .catch(error => {
            console.error('Error fetching item:', error);
        });
});

function renderNewInputFields() {
    const scannedItemsContainer = document.querySelector('.scanned-items');

    // Create a new 'data' div to replicate the original structure
    const newRow = document.createElement('div');
    newRow.classList.add('data');

    // Create new SKU input field with label
    const newSKUFieldSection = document.createElement('div');
    newSKUFieldSection.classList.add('input-section');
    const skuLabel = document.createElement('label');
    skuLabel.innerText = "SKU: ";
    newSKUFieldSection.appendChild(skuLabel);
    const newSKUField = document.createElement('input');
    newSKUField.type = 'text';
    newSKUField.placeholder = 'Scan Next Barcode';
    newSKUField.className = 'sku';
    newSKUFieldSection.appendChild(newSKUField);
    newRow.appendChild(newSKUFieldSection); 

    // Create new Name input field with label
    const newNameFieldSection = document.createElement('div');
    newNameFieldSection.classList.add('input-section');
    const nameLabel = document.createElement('label');
    nameLabel.innerText = "Name: ";
    newNameFieldSection.appendChild(nameLabel);
    const newNameField = document.createElement('input');
    newNameField.type = 'text';
    newNameField.placeholder = 'Item Name';
    newNameField.className = 'name';
    newNameFieldSection.appendChild(newNameField);
    newRow.appendChild(newNameFieldSection); 

    // Create new Quantity input field with label
    const newQuantityFieldSection = document.createElement('div');
    newQuantityFieldSection.classList.add('input-section');
    const quantityLabel = document.createElement('label');
    quantityLabel.innerText = "Quantity: ";
    newQuantityFieldSection.appendChild(quantityLabel);
    const newQuantityField = document.createElement('input');
    newQuantityField.type = 'number';
    newQuantityField.placeholder = 'Quantity';
    newQuantityField.value = "1";
    newQuantityField.className = "quantity";
    newQuantityFieldSection.appendChild(newQuantityField);
    newRow.appendChild(newQuantityFieldSection);

    // Create new Current Quantity input field with label
    const newCurrentQuantitySection = document.createElement('div');
    newCurrentQuantitySection.classList.add('input-section');
    const currentQuantityLabel = document.createElement('label');
    currentQuantityLabel.innerText = "Current Quantity: ";
    newCurrentQuantitySection.appendChild(currentQuantityLabel);
    const newCurrentQuantityField = document.createElement('input');
    newCurrentQuantityField.type = 'number';
    newCurrentQuantityField.readOnly = true;  
    newCurrentQuantityField.className = "current-quantity";
    newCurrentQuantitySection.appendChild(newCurrentQuantityField);
    newRow.appendChild(newCurrentQuantitySection);

    // Append the newRow to the scannedItemsContainer
    scannedItemsContainer.appendChild(newRow);

    // Add event listener to the new SKU field
    newSKUField.addEventListener('input', function() {
        const skuValue = this.value;

        // Fetch item details based on SKU from the backend
        fetch(`http://localhost:3000/findname/${skuValue}`)
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    alert('This is an invalid SKU number. Make sure that the item is in the database or the SKU number is inserted correctly');
                } else {
                    // Populate the 'name' and 'current quantity' fields and store the item_id in dataset
                    this.dataset.itemId = data.itemDetails.id;
                    newNameField.value = data.itemDetails.item_variation_data.name;
                    newCurrentQuantityField.value = data.quantityDetails;
                    
                    // Render new input fields for the next item
                    renderNewInputFields();
                }
            })
            .catch(error => {
                console.error('Error fetching item:', error);
            });
    });
}


function UploadData() {
    const mainDataDiv = document.querySelector('.data');
    const scannedItemsContainer = document.querySelector('.scanned-items');
    const scannedItemRows = scannedItemsContainer.querySelectorAll('.data'); // Move this line here
    let changes = [];
    const currentDateTime = new Date().toISOString();

    // Extract data from main 'data' div
    const mainQuantity = parseInt(mainDataDiv.querySelector('#quantity').value, 10) || 0;
    const mainCurrentQuantity = parseInt(mainDataDiv.querySelector('#current-quantity').value, 10) || 0;
    const itemId = mainDataDiv.querySelector('.sku').dataset.itemId;

    let mainTotal = mainQuantity + mainCurrentQuantity;

    changes.push({
        type: "PHYSICAL_COUNT",
        physical_count: {
            catalog_object_id: itemId,
            occurred_at: currentDateTime,
            location_id: 'LEY19PZ4JMWRM',
            quantity: mainTotal.toString(),
            state: "IN_STOCK"
        }
    });

    // Extract data from 'scanned-items' div
    
    scannedItemRows.forEach(row => {
        const quantity = parseInt(row.querySelector('.quantity').value, 10) || 0;
        const currentQuantity = parseInt(row.querySelector('.current-quantity').value, 10) || 0;
        const total = quantity + currentQuantity;
        const itemId = row.querySelector('.sku').dataset.itemId;
    
        changes.push({
            type: "PHYSICAL_COUNT",
            physical_count: {
                catalog_object_id: itemId,
                occurred_at: currentDateTime,
                location_id: 'LEY19PZ4JMWRM',
                quantity: total.toString(),
                state: "IN_STOCK"
            }
        });
    });
    
    changes.pop()
    // Convert items to JSON
    const jsonData = JSON.stringify(changes);
    console.log(jsonData)

// Send data to server
fetch('http://localhost:3000/uploaddata', {
    method: 'POST',
    headers:{
        'Content-Type': "application/json"
    },
    body: jsonData
}).then(response => {
    if (response.ok) {
        return response.json();
    }
    throw new Error('Failed to upload data');
}).then(data => {
    console.log('Data uploaded:', data);
    
    // Add an alert to notify the customer
    alert('Your data has been uploaded successfully!');
    
    // Refresh the page
    location.reload();

}).catch(error => {
    console.error('Upload error:', error);
});

}

