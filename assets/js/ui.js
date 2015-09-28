// Imports
var rele = require('rele'),
    gui = require('nw.gui'),
    win = gui.Window.get(),
    fs = require('fs')

var windowIsBlurred = false

// Tray icon & menu
var tray = new gui.Tray({ title: 'Rele', tooltip: 'Rele' }),
    trayMenu = new gui.Menu()
trayMenu.append(new gui.MenuItem({type: 'checkbox', label: 'Notifications'}))
tray.icon = 'assets/img/icon.png'
tray.menu = trayMenu

// Set/unset blur
win.on('blur', function () {
    windowIsBlurred = true
})
win.on('focus', function () {
    windowIsBlurred = false
    win.requestAttention(false)
})

// Cleanup on window close
window.onbeforeunload = cleanUp;
win.on('close', cleanUp)

// Redraws
function redrawNetworks(data) {
    console.info('Redrawing networks')
    // HACK:
    setTimeout(function() {
        var n = $('#network-list')
        $(n).empty()

        var h = $('<span>').addClass('menu-heading').append($('<span>').addClass('octicon octicon-radio-tower'))
        $(n).append(h)

        data.networks.forEach(function(network) {
            console.info('Redrawing network ' + network.host)
            var a = $('<a>').addClass('menu-item css-truncate-target css-truncate-network').attr('href', '#').text(network.host)
            var ctxMenu = new gui.Menu()
            ctxMenu.append(new gui.MenuItem({
                label: 'Disconnect',
                click: function() {
                    network.disconnect('Leaving network', function(){
                        console.info('Left ' + network.host)
                    })
                }
            }))
            $(a).on('contextmenu', function(evt) {
                evt.preventDefault()
                ctxMenu.popup(evt.x + 20, evt.y + 20)
                return false
            })
            $(a).on('click', function(evt) {
                rele.setCurrentNetwork(network)
                rele.setCurrentChannel(network.currentChannel)
            })
            if (network.isCurrent()) {
                $(a).addClass('selected')
            } else if (network.hasActivity && !network.isCurrent()) {
                $(a).addClass('activity')
                if (network.hasHighlight) {
                    $(a).addClass('highlight')
                }
            }
            $('#network-list').append(a)
        })
        redrawChannels({network: rele.getCurrentNetwork(), channels: rele.getCurrentNetwork() ? rele.getCurrentNetwork().channels : []})
    }, 0)
}

function drawTab(template, channel) {
    var tab = $('<a>').attr('href', '#').addClass('tabnav-tab css-truncate-target css-truncate-tab channel-tab')
    if (channel.isCurrent()) {
        $(tab).addClass('selected')
    } else if (channel.hasActivity && !channel.isCurrent()) {
        $(tab).addClass('activity')
        if (channel.hasHighlight) {
            $(tab).addClass('highlight')
        }
    }
    $(tab).on('click', function() {
        channel.visited()
        rele.setCurrentChannel(channel)
    })
    if (channel.name === '_') {
        $(tab).append($('<span>').addClass('octicon octicon-terminal'))
    } else {
        $(tab).text(channel.name)
    }
    if (channel.name !== '_') {
        $(tab).append($('<span>').addClass('octicon octicon-x close-channel').on('click', function() {
            channel.part(null, function() {})
            rele.setCurrentChannel(rele.getCurrentNetwork().systemChannel())
        }))
    }

    $(template).find('.channel-list').append(tab)
}

function redrawLog(data) {
    $('.log-column').empty()
    if (data.channel.isCurrent()) {
        data.channel.log.forEach(function(message) {
            var a = $('<article>')
            var t = $('<div>').addClass('timestamp').text(msToTime(message.timestamp))
            var n = $('<div>').addClass('name').text(message.handle || '')
            $(n).on('click', function() {
                $('.input-send').val($('.input-send').val() + $(this).text())
            })

            var p = $('<p>').addClass(message.type).text(message.message)
            $(p).linkify()

            $(p).find('a').each(function() {
                $(this).attr('data-external-resource', $(this).attr('href'))
                $(this).attr('href', '#')
            })

            if (shouldHighlight({network: data.network, channel: data.channel, handle: message.handle, message: message.message})) {
                $(p).addClass('activity')
            }

            $(a).append(t)
            $(a).append(n)
            $(a).append(p)
            $('.log-column').append(a)
        })
        $('.log-column [data-external-resource]').on('click', function() {
            gui.Shell.openExternal($(this).attr('data-external-resource'))
        })
        $('.log-column').scrollTop($('.log-column')[0] ? $('.log-column')[0].scrollHeight : 0)
    }
}

function redrawChannels(data) {
    var currentChannel = rele.getCurrentChannel(),
        currentNetwork = rele.getCurrentNetwork()

    $('.channels-column').empty()

    if (!('network' in data) || !data.network || !data.network.isCurrent()) return

    $.ajax({url: 'assets/templates/network.html'}).done(function(template) {
        var template = $(template)
        if (data.network && data.channels) {
            data.channels.forEach(function(channel) {
                console.info('Redrawing channel ' + channel.name)
                drawTab(template, channel)
            })

            var dialogButtons = $(template).find('[data-toggle-dialog]')
            if (currentNetwork.connected) {
                $(dialogButtons).removeClass('disabled')
            }
            $(dialogButtons).on('click', toggleDialog)

            $('.channels-column').html(template)
            $('.input-send').attr('placeholder', data.network.client.nick)
            $('.input-send').on('keypress', function(evt) {
                if (evt.keyCode === 13) { // Enter
                    var msg = $(this).val()
                    if (msg[0] === '/') {
                        handleCommand(currentNetwork, msg)
                    } else {
                        currentChannel.say(msg)
                    }
                    $(this).val('')
                }
            })
        } else {
            $('.channels-column').empty()
        }
        redrawLog({network: currentNetwork, channel: currentChannel})
        redrawUsers({network: currentNetwork, channel: currentChannel})
    })
}

function redrawUsers(data) {
    var currentChannel = rele.getCurrentChannel(),
        currentNetwork = rele.getCurrentNetwork()
    if (!currentChannel) return
    if (!data.network.isCurrent() || !data.channel.isCurrent()) return

    $('.user-list').empty()
    for (var i = 0; i < Object.keys(data.channel.users).length; i++) {
        var name = Object.keys(data.channel.users)[i],
            mode = data.channel.users[name]

        var aElem = $('<a>').attr('href', '#').addClass('filter-item').text(name)
        if (name === data.network.client.nick) {
            $(aElem).addClass('selected')
        }
        if (mode) {
            $(aElem).append(
                $('<span>').addClass('count').text(mode)
            )
        }

        $('.user-list').append($('<li>').append($(aElem)))
    }
}

function loadDialog(dialogName) {
    if (!dialogName) return
    $.ajax({url: 'assets/templates/' + dialogName + '.html'}).done(function(data) {
        var template = $(data)
        $('dialog').html(template)
        $('dialog').get(0).open = true
    })
}

function toggleDialog(evt) {
    if ($('dialog').get(0).open) {
        $('dialog').get(0).open = false
    } else {
        var dialogName = $(evt.delegateTarget).attr('data-toggle-dialog')
        loadDialog(dialogName)
    }
}

function handleCommand(network, cmd) {
    var parts = cmd.split('')
    parts.shift()
    parts = parts.join('').split(' ')

    var start = 'rele.getCurrentNetwork().client.send(',
        end = ')'

    var args = '"' + parts.join('", "') + '"'
    console.log(args)

    eval(start + args + end)
}

function highlight(data) {
    if (windowIsBlurred) {
        $('[data-sound-highlight]').get(0).play()

        var title = ''
        if (data.handle === data.channel.name) { // A private query
             title = data.handle
        } else {
            title = data.handle + ' ' + data.channel.name
        }
        var body = data.message

        var attentionTimer = setTimeout(function () {
            win.requestAttention(true)
        }, 5000)
        highlightNotification = new Notification(title, { body: body, icon: 'assets/img/icon.png' })
        highlightNotification.onclick = function () {
            clearTimeout(attentionTimer)
            data.channel.visited()
            rele.setCurrentChannel(data.channel)
            win.show()
            win.focus()
        }

        redrawChannels({network: data.network, channels: data.network.channels})
    }
}

function activity(data) {
    redrawNetworks({networks: rele.getNetworks()})
}

function shouldHighlight(data) {
    return (data.message && data.message.toLowerCase().indexOf(data.network.client.nick.toLowerCase()) > -1)
}

// Event listeners
rele.on('changeNetworks', redrawNetworks)
rele.on('changeChannels', redrawChannels)
rele.on('changeLog', redrawLog)
rele.on('changeUsers', redrawUsers)
rele.on('activity', activity)
rele.on('highlight', highlight)
rele.on('shouldHighlight', shouldHighlight)

$(document).ready(function(){
    $('[data-toggle-dialog]').on('click', toggleDialog)
});
