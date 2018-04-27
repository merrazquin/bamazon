const inquirer = require('inquirer'),
    BamazonProductManager = require('./BamazonProductManager'),
    productManager = new BamazonProductManager(onConnected)

function onConnected() {
    productManager.getAllProducts(managerMenu)
}

function managerMenu() {
    inquirer.prompt({
        type: 'list',
        name: 'action',
        message: 'Choose an action',
        choices: [
            { name: 'View Products for Sale', value: productManager.getAllProducts },
            { name: 'View Low Inventory', value: productManager.getLowInventory },
            { name: 'Add to Inventory', value: promptToAddInventory },
            { name: 'Add New Product', value: promptToAddProduct }
        ]
    }).then(response => {
        response.action.apply(this, [displayProducts])
    })
}

function promptToAddInventory(callback) {
    inquirer.prompt([
        {
            type: 'input',
            name: 'id',
            message: 'Enter the product ID',
            validate: input => {
                if (isNaN(input)) {
                    return 'Please enter a numbrer'
                }

                if (!productManager.findProductById(input)) {
                    return 'Please enter a valid product number'
                }

                return true
            }
        },
        {
            type: 'input',
            name: 'qty',
            message: "Enter the quantity you'd like to add",
            validate: input => {
                if (isNaN(input) || input < 1 || input % 1 < 0) {
                    return 'Please enter a positive integer'
                }

                return true
            }
        }
    ]).then(response => {
        productManager.addToInventory(response.id, response.qty, callback)
    })
}

function promptToAddProduct(callback) {
    inquirer.prompt([
        {
            type: 'input',
            name: 'name',
            message: 'Enter the product name',
            validate: notEmpty
        },
        {
            type: 'input',
            name: 'department',
            message: 'Enter the department name',
            validate: notEmpty
        },
        {
            type: 'input',
            name: 'price',
            message: 'Enter the unit price',
            validate: input => {
                if (!input || isNaN(input)) {
                    return 'Please enter a dollar value'
                }

                return true
            }
        },
        {
            type: 'input',
            name: 'qty',
            message: "Stock available",
            validate: input => {
                if (!input || isNaN(input) || input < 1 || input % 1 < 0) {
                    return 'Please enter a positive integer'
                }

                return true
            }
        }
    ]).then(response => {
        productManager.addNewProduct(response.name, response.department, parseFloat(response.price).toFixed(2), response.qty, callback)
    })
}

function displayProducts(products) {
    productManager.displayProducts(products)
    managerMenu()
}

function notEmpty(input) {
    if (!input) return 'Required'

    return true
}

function exitHandler(options, err) {
    productManager.exit()
    if (options.exit) process.exit()
}

process.on('SIGINT', exitHandler.bind(null, { exit: true }))