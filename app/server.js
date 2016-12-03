const electron = require("electron");
const fs = require("fs");

function getURLParameter(name) {
    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [null, ''])[1].replace(/\+/g, '%20')) || null;
}

// ensure server folder already exists
fs.mkdir("servers", 0777, function(err){
        if(err){
            if(err.code == "EEXIST"){
                // do nothing; folder already exists
            }else{
                console.log("Unable to create servers folder", err);
            }
        }
});

var Servers = [];
var servers = fs.readdirSync("servers/");
for(server in servers){
    Servers.push(JSON.parse(fs.readFileSync("servers/" + servers[server], "utf-8")));
}

var Channels = [];

// we have to import jQuery weirdly because of Electron
window.$ = window.jQuery = require(__dirname + '/res/js/jquery.min.js');

// handle form togglers
function toggle(id){
    var element = document.getElementById(id);
    if(element.classList.contains("shown")){
        // if shown, hide it
        element.classList.remove("shown");
    }else{
        // otherwise, show it
        element.classList.add("shown");
    }
}

$(document).ready(function(){
    /* try{
        var settings = JSON.parse(fs.readFileSync('settings.json', 'utf8'));
        popFields(settings);
    }catch(err){
        console.log("unable to open settings.json; probably first run:", err);
    } */

    var serverId = getURLParameter("serv");
    console.log(serverId);
    if(serverId){
        popFields(Servers[serverId]);
    }else{
        serverId = Servers.length;
    }

    $('#connect').submit(function(){
        // set up the settings array
        var settings = {
            server: {
                address: $("#server").val(),
                port: $("#port").val(),
                password: $("#srvPass").val()
            },
            security: {
                secure: $("#sasl").is(":checked"),
                badCertsAllowed: $("#badCert").is(":checked")
            },
            user: {
                nickname: $("#nick").val(),
                username: $("#username").val(),
                realname: $("#realname").val(),
                password: $("#nsPass").val()
            },
            encoding: $("#encoding").val(),
            retry: {
                count: $("#retryCount").val(),
                delay: $("#retryDelay").val()
            },
            messages: {
                stripForm: $("#clearColours").is(":checked"),
                log: $("#logMessages").is(":checked")
            },
            floodProtect: $("#floodProtect").is(":checked"),
            channels: Channels
        };
        // electron.ipcRenderer.send("server_connect", settings);
        // convert it to a JSON array
        var jsonSettings = JSON.stringify(settings, null, 4);
        // write it to a file, to persist for next time
        fs.writeFile("servers/" + serverId + '.json', jsonSettings, 'utf8', function(err) {
            if(err) {
                console.log("couldn't write settings to json file: ", err);
            } else {
                console.log("settings saved as json: " + serverId + ".json");
            }
        });
        window.location = "dash.html";
        return false;
    });
});

function popFields(json){
    // parse the JSON stuff into the form fields.
    $("#server").val(json.server.address);
    $("#port").val(json.server.port);
    $("#srvPass").val(json.server.password);
    $("#nick").val(json.user.nickname);
    $("#username").val(json.user.username);
    $("#realname").val(json.user.realname);
    $("#nsPass").val(json.user.password);
    $("#encoding").val(json.encoding);
    $("#retryCount").val(json.retry.count);
    $("#retryDelay").val(json.retry.delay);
    $("#sasl").prop("checked", json.security.secure);
    $("#badCert").prop("checked", json.security.badCertsAllowed);
    $("#clearColours").prop("checked", json.messages.stripForm);
    $("#logMessages").prop("checked", json.messages.log);
    $("#floodProtect").prop("checked", json.floodProtect);
    Channels = json.channels;
}