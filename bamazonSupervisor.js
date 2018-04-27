const inquirer = require('inquirer'),
    BamazonProductManager = require('./BamazonProductManager'),
    productManager = new BamazonProductManager(supervisorMenu)

function supervisorMenu() {
    inquirer.prompt({
        type: 'list',
        name: 'action',
        message: 'Choose an action',
        choices: [
            { name: 'View Product Sales by Department', value: productManager.getAllDepartments },
            { name: 'Create New Department', value: promptToAddDepartment }
        ]
    }).then(response => {
        response.action.apply(this, [displayDepartments])
    })
}

function promptToAddDepartment(callback) {
    inquirer.prompt([
        {
            type: 'input',
            name: 'name',
            message: 'Enter the department name',
            validate: notEmpty
        },
        {
            type: 'input',
            name: 'overhead',
            message: 'Enter the overhead',
            validate: input => {
                if (!input || isNaN(input)) {
                    return 'Please enter a dollar value'
                }

                return true
            }
        }
    ]).then(response => {
        productManager.addNewDepartment(response.name, parseFloat(response.overhead).toFixed(2), callback)
    })
}

function displayDepartments(departments) {
    productManager.displayDepartments(departments)
    supervisorMenu()
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
