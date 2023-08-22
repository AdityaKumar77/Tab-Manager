let tabActivity = {};
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.type === "gettabs") {
        chrome.tabs.query({}, function (tabs) {
            // console.log("fuck");
            sendResponse(tabs);
        });
    }
    return true;
});


