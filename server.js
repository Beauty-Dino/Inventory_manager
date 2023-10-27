const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;
const Auth = 'EAAAEHFkgFd6vbgT05doAvMWApQBecbXnDZq6zM2BWAhQ7i318fqOWd39iZQfWeZ';
const Item_Variation = 'https://connect.squareupsandbox.com/v2/catalog/list?types=item_variation';
const inventory_change = "https://connect.squareupsandbox.com/v2/inventory/changes/batch-create"

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
});

const axios = require('axios');

app.use(cors('localhost:5500'));
app.use(express.json());


//finditem
app.get('/findname/:sku', async (req, res) => {
    const skuValue = req.params.sku;

    try {
        const response = await axios.get(Item_Variation, {
            headers: {
                'Authorization': `Bearer ${Auth}`,
                'Square-Version': '2022-03-23',
                'Content-Type': "application/json"
            }
        });

        let isSkuFound = false;
        if (response.data) {
            const Item_list = response.data.objects;
            console.log(Item_list)
            for (let variation = 0; variation < Item_list.length; variation++) {
                let Response_SKU = Item_list[variation].item_variation_data.sku;
                let response_Name = Item_list[variation].item_variation_data.name;
                console.log(Response_SKU, response_Name)
            
                if (skuValue == Response_SKU) {
                    // If SKU matches, then update the response_Name and set isSkuFound to true
                    isSkuFound = true;
                    let ID = Item_list[variation].id;
                    const quantity_retreival = `https://connect.squareupsandbox.com/v2/inventory/${ID}?location_ids=`;
                    const quantity = await axios.get(quantity_retreival, {
                        headers:{
                            'Authorization': `Bearer ${Auth}`,
                            'Square-Version': '2022-03-23',
                            'Content-Type': "application/json"
                        }
                    });

                    const conRes = {
                        itemDetails: Item_list[variation],
                        quantityDetails: quantity.data.counts[0].quantity
                    };
                    console.log(conRes)
                    res.json(conRes)
                    return
                }
            }
        }
        
        if (!isSkuFound) {
            res.status(404).send('SKU not found');
        }

    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error');
    }
});


const { v4: uuidv4 } = require('uuid');
//Uploaddata
app.post('/uploaddata/', async (req, res) => {
    const changes = req.body;
    console.log(changes)
    
    const idempotent_key = uuidv4();  // Generate a new unique idempotency key
    

    try {
        const response = await axios.post(inventory_change, 
            {
                idempotency_key: idempotent_key,
                changes,//Data
                ignore_unchanged_counts: true,
            },
            {
                headers: {
                    'Authorization': `Bearer ${Auth}`,
                    'Square-Version': '2022-03-23',
                    'Content-Type': "application/json"
                }
            }
        );

        // Handle the response as needed
        res.json(response.data);

    } catch (error) {
        console.log("error message: ", error);
        if (error.response) {
            //Debugging
            console.log("Server response error data:", error.response.data);
            console.log("Server response error status:", error.response.status);
            console.log("Server response error headers:", error.response.headers);
        }
        res.status(500).json({ error: error.message });
    }
});

