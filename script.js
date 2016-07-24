// Calls 'getImages()' function on enter key press
$(document).ready(function() {
    $('#user-str').keydown(function(event) {
        if (event.keyCode == 13) {
            getImages();
            return false;
         }
    });
});



// Robust
/* 'isEmpty', function, checks server returned value and returns appropriate value one of:
    original value,
    '[]', string,
    null,
    undefined,
    NaN, or ''
    @param 'arg', value that is assumed to be empty
*/
isEmpty = function(arg) {
    var value = JSON.stringify(arg) === '[]' ? null : arg;

    return [null, undefined, NaN, ''].includes(value);
};


/* 'updateStatus', function, updates status during loading
    @param 'statusText', string given to show in text value field
    @param 'statusState', string, that displays statustext in color, depends on Bootstrap
*/
updateStatus = function(statusText, statusState) {
    var statusNode = document.getElementById('status');
    var statusNodeElement = document.createElement('p');
    var statusNodeText = document.createTextNode(statusText);
    
    statusNodeElement.className = statusState;

    // Removes child nodes
    while (statusNode.hasChildNodes()) {
        statusNode.removeChild(statusNode.firstChild);
    }

    // Updates with new text
    //statusNode.appendChild(document.createTextNode(statusText));
    statusNodeElement.appendChild(statusNodeText);
    statusNode.appendChild(statusNodeElement);
};


/* 'pushImage', function, adds elements under HTML ul list element
    @param 'src', string, image url
*/
pushImage = function(src) {
    var listNode = document.getElementById('instagram-list');
    var listElementNode = document.createElement('li');
    var imageElement = document.createElement('img');

    listElementNode.className = 'instagram-list__element';
    imageElement.className = 'instagram-list__element__img';
    imageElement.src = src;

    // Packs everything
    listElementNode.appendChild(imageElement);
    listNode.appendChild(listElementNode);
};


/* 'Get Images', button function
    Displays low resolution images from instagram if username is valid
*/
getImages = function() {
    document.getElementById('bring-img').disabled = true;
    document.getElementById('user-str').disabled = true;
    /* 'userName' holds value inserted into 'Username:' box
        alloworigin: rate limited. 1 request per 5 seconds.
       'mediaUrl' connects 'Username:' and instagram media page
    */
    var userName = document.getElementById('user-str').value;
    var alloworigin = 'http://alloworigin.com/get?url=';
    var mediaUrl = alloworigin + 'https://www.instagram.com/' + userName + '/media/';

    /* 'latestPart1', holds key part to use for user media page later
       'latestPart2', holds final image id in user media object, this is used to query for new page
       'fullQuery', connects 'mediaUrl', 'latestPart1' and 'latestPart2' to form new query
       'jsonArr', array, holds info about server returned objects
       'more', boolean, holds user media page value, 'true' means there is next page, 'false' means there is no next page
    */
    var latestPart1 = '?max_id=';
    var latestPart2;
    var fullQuery;
    var jsonArr;
    var more = true;

    try {
        updateStatus('Loading...', 'text-success');

        clearClicked = 0;

            /* 'getAll', recursive function
                @param: 'more', boolean, for first page is set to true, each next page depends on media data
                @param: 'url', string
                images are added to the page on the go
            */
            getAll = function(more, url){

                if (more && clearClicked === 0) {
                    // Page query
                    $.getJSON(url, function(data){
                        // Gets the results

                        if (isEmpty(data)) {
                            updateStatus('Got nothing', 'text-info');
                            document.getElementById('bring-img').disabled = false;
                            document.getElementById('user-str').disabled = false;
                            return;
                        } else if (data.status_code === 404) {
                            updateStatus('User not found.', 'text-warning');
                            document.getElementById('bring-img').disabled = false;
                            document.getElementById('user-str').disabled = false;
                            return;
                        }

                        // 'jsonForm' returns object (e.g. Object {status: "ok", items: Array[20], more_available: true} )
                        var jsonForm = JSON.parse(data.contents);
                        if (jsonForm.items.length < 1) {
                            updateStatus('Got nothing', 'text-info');
                            return;
                        }

                        jsonArr = jsonForm.items;

                        //console.debug('jsonForm', jsonForm);
                        //console.debug('jsonArr', jsonArr.length);

                        latestPart2 = jsonArr[jsonArr.length - 1].id;

                        for (i in jsonArr) {
                            pushImage(jsonArr[i].images.low_resolution.url);
                        }

                        fullQuery = mediaUrl + latestPart1 + latestPart2;
                        more = jsonForm.more_available;

                        //return getAll(more);
                        return setTimeout(function() {
                            getAll(more, fullQuery);
                        }, 5100);
                      }, function(response) {
                          console.error(response);
                          updateStatus('ERROR', 'text-danger');
                    });
                  } else {
                    //return more;
                    updateStatus('Done!', 'text-primary');
                    document.getElementById('bring-img').disabled = false;
                    document.getElementById('user-str').disabled = false;
                    }
            };
            getAll(more, mediaUrl);
    } catch(err) {
        document.getElementById('bring-img').disabled = false;
        document.getElementById('user-str').disabled = false;
        console.log(err.message);
        console.log(err.name);
    }
};


/* 'Clear Images' button function
    Clears all added images from page and also stops ongoing process.
    'clearClicked', int, initial value is 0, but if button is clicked, value is set to 1 and then ongoing process ends
*/
var clearClicked = 0;
clearImages = function() {
    var children = $('#instagram-list').children();

    clearClicked = 1;
    if (isEmpty(children)) {
        console.log('There are no images!');
    } else {
        children.empty();
        //console.log("Images cleared!");
        updateStatus('Images cleared!', 'text-info');
    }
};



/* 'Realtime Update' button function
    During 1 minute or until button 'Clear Images' is clicked, adds all new images to the page
*/
followUser = function() {
    // Disables 'Get Images' button for the duration of the function
    document.getElementById('bring-img').disabled = true;
    document.getElementById('user-str').disabled = true;
    clearImages();
    clearClicked = 0;
    updateStatus('Waiting for user to post new images!', 'text-info');

    /*  'clicktime', number, current time in UNIX setting
        'userName' holds value inserted into 'Username:' box
        alloworigin: rate limited. 1 request per 5 seconds.
        'mediaUrl' connects 'Username:' and instagram media page
    */
    var clicktime = (new Date).getTime();
    var userName = document.getElementById('user-str').value;
    var alloworigin = 'http://alloworigin.com/get?url=';
    var mediaUrl = alloworigin + 'https://www.instagram.com/' + userName + '/media/';

    getNewest = function() {
        
        // 'currentTime', number, if time is too late, function ends
        var currentTime = (new Date).getTime();

        try {

            if (currentTime - clicktime <= 65000 && clearClicked === 0) {

                $.getJSON(mediaUrl, function(data){
                    // Gets the results

                    if (isEmpty(data)) {
                        updateStatus('Got nothing', 'text-info');
                        document.getElementById('bring-img').disabled = false;
                        document.getElementById('user-str').disabled = false;
                        return;
                    } else if (data.status_code === 404) {
                        updateStatus('User not found.', 'text-warning');
                        document.getElementById('bring-img').disabled = false;
                        document.getElementById('user-str').disabled = false;
                        return;
                    }

                    // 'jsonForm' returns object (e.g. Object {status: "ok", items: Array[20], more_available: true} )
                    var jsonForm = JSON.parse(data.contents);

                    if (jsonForm.items.length < 1) {
                        updateStatus('Got nothing', 'text-info');
                        return;
                    }

                    var jsonArr = jsonForm.items;
                    // 'imgTime', object, date in UNIX setting
                    var imgTime;
                    
                    for (i in jsonArr) {
                        imgTime = new Date(parseInt(jsonArr[i].created_time)*1000);
                        if (imgTime > currentTime) {
                            pushImage(jsonArr[i].images.low_resolution.url);
                        }
                    }
                    
                    return setTimeout(function() {
                        getNewest()
                    }, 5100);

                }, function(response) {
                    console.error(response);
                    updateStatus('ERROR', 'text-danger');
                  });

            } else {
                updateStatus('Done!', 'text-primary');
                document.getElementById('bring-img').disabled = false;
                document.getElementById('user-str').disabled = false;
              }

        } catch(err) {
            document.getElementById('bring-img').disabled = false;
            document.getElementById('user-str').disabled = false;
            console.log(err.message);
            console.log(err.name);
         }
    };
    setTimeout(function(){
        getNewest();
    }, 5100)
};