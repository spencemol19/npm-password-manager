var crypto = require('crypto-js');
var storage = require('node-persist');
storage.initSync();

console.log("starting password manager...\n");

var argv = require('yargs')
    .command('create', 'Creates account', function (yargs) {
        yargs.options({
            name: {
                demand: true,
                alias: 'n',
                description: 'Account name (eg: Facebook, Gmail)',
                type: 'string'
            },
            username: {
                demand: true,
                alias: 'u',
                description: 'Your username goes here',
                type: 'string'
            },
            password: {
                demand: true,
                alias: 'p',
                description: 'Your password goes here',
                type: 'string'
            },
            masterPassword: {
                demand: true,
                alias: 'm',
                description: 'Master password',
                type: 'string'
            }
        }).help('help');
    })
    .command('get', 'Retrieve account using account name', function(yargs) {
        yargs.options({
            name: {
                demand: true,
                alias: 'n',
                description: 'Account name',
                type: 'string'
            },
            masterPassword: {
                demand: true,
                alias: 'm',
                description: 'Master password',
                type: 'string'
            }
        })
    }).help('help')
    .argv;

var command = argv._[0];
console.log(argv);

/*Account Methods*/

function getAccounts (masterPassword) {
    var encryptedAccount = storage.getItemSync('accounts'); 
    var accounts = [];
    if (typeof encryptedAccount !== 'undefined') { 
       var bytes = crypto.AES.decrypt(encryptedAccount, masterPassword);
       accounts = JSON.parse(bytes.toString(crypto.enc.Utf8)); 
    }

    return accounts;
}

function saveAccounts (accounts, masterPassword) {
    var encryptedAccounts = crypto.AES.encrypt(JSON.stringify(accounts), masterPassword);
    
    storage.setItemSync('accounts', encryptedAccounts.toString());
    
    return accounts;
}

function createAccount (account /*Object*/, masterPassword /*String*/) {
    var accounts = getAccounts(masterPassword);
    accounts.push(account);
    
    saveAccounts(accounts, masterPassword);
    
    return account;
}

function getAccount (accountName /*String*/, masterPassword /*String*/) {
    var accounts = getAccounts(masterPassword);
    var matchingAccount;
    
    for (var i = 0; i < accounts.length; i++) {
        if (accounts[i].name === accountName)
            matchingAccount = accounts[i];
    }
    
    return matchingAccount;
}

function deleteAccount (accountName /*String*/, masterPassword /*String*/) {
    var accounts = getAccounts(masterPassword);
    var account = getAccount(accountName, masterPassword);
    var updatedAccounts = accounts.splice(accounts.indexOf(account), 1);
    storage.removeItemSync('accounts');
    saveAccounts(updatedAccounts, masterPassword);
    
    return account;
}

switch(command) {
    case 'create':
        try {
            if (argv.name.length > 0 && argv.username.length > 0 && argv.password.length > 0 && argv.masterPassword.length > 0) {
                var entry = createAccount({
                    name: argv.name,
                    username: argv.username,
                    password: argv.password
                }, argv.masterPassword);
                console.log(`${entry.name} Account added`);
            } else
                console.log("One or more arguments contain no value");
        }
        catch(err) {
            console.log("Unable to create account.\n" + err.message);
        }
    break;
    case 'get':
        try {
            if (argv.name.length > 0 && argv.masterPassword.length > 0) {
                var desiredAcct = getAccount(argv.name, argv.masterPassword);
                if (typeof desiredAcct !== 'undefined') {
                    console.log(`Here Are Our Records for Your ${desiredAcct.name} account:\n`);
                    console.log(`Username: ${desiredAcct.username}`);
                    console.log(`Password: ${desiredAcct.password}`);
                } else
                    console.log(`No records exist for your ${argv.name} account.`);
            } else
                console.log("No value given for Account Name");
        }
        catch(err) {
            console.log("Unable to fetch account.\n" + err.message);
        }
    break;
}