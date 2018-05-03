const INSUFFICIENT_MSG = 'Insufficient quantity!'

const inquirer = require('inquirer'),
    BamazonProductManager = require('./BamazonProductManager'),
    productManager = new BamazonProductManager(onInit)

function onInit() {
    productManager.getAllProducts(promptSale)
}

function promptSale(products) {
    productManager.displayProducts(products)

    inquirer.prompt([
        {
            type: 'input',
            name: 'id',
            message: 'Enter the product ID (or "q" to exit)',
            validate: input => {
                if(input.toLowerCase() == 'q') process.exit()

                if (isNaN(input)) {
                    return 'Please enter a number'
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
            message: "Enter the quantity you'd like to purchase (or \"q\" to exit)",
            validate: input => {
                if(input.toLowerCase() == 'q') process.exit()

                if (isNaN(input) || input < 1 || input % 1 < 0) {
                    return 'Please enter a positive integer'
                }

                return true
            }
        }
    ]).then(response => {
        let product = productManager.findProductById(response.id)
        if (!product) {
            console.log('Product not found')
            promptSale(products)
        } else if (product.stock_quantity < parseInt(response.qty)) {
            console.log('*'.repeat(INSUFFICIENT_MSG.length).red)
            console.log(INSUFFICIENT_MSG.red)
            console.log('*'.repeat(INSUFFICIENT_MSG.length).red)
            promptSale(products)
        } else {
            productManager.processOrder(product.item_id, response.qty, product.price, promptSale)
        }
    })
}


function exitHandler(options, err) {
    productManager.exit()
    if (options.exit) process.exit()
}

process.on('exit', exitHandler.bind(null))
process.on('SIGINT', exitHandler.bind(null, { exit: true }))