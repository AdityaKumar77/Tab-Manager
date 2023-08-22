// Event listener to execute the code once the DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    const selectButton = document.getElementById("selectTabsButton");
    const deleteButton = document.getElementById("deleteSelectedTabsButton");

    let selectedTabs = [];
    let originalTabCount = 0;
    let tabcountforselect = 0;
    let isSelectionMode = false; // Flag for selection mode

    // Add event listener for the "Select Tabs" button
    selectButton.addEventListener("click", () => {
        if (isSelectionMode) {
            selectButton.innerHTML = "Select Tabs"
            resetSelectionMode();
        } else {
            const tabElements = document.querySelectorAll(".tabss");
            originalTabCount = tabElements.length;
            selectButton.innerHTML = "Cancel Selection"
            tabElements.forEach(tabElement => {
                tabcountforselect++;
                tabElement.addEventListener("click", toggleTabSelection);
            });
            isSelectionMode = true;
        }
    });

    // Add event listener for the "Delete Selected Tabs" button
    deleteButton.addEventListener("click", () => {
        if (selectedTabs.length != 0) {
            selectedTabs.forEach(tab => {
                const tabId = Number(tab.dataset.tabId);
                chrome.tabs.remove(tabId); // Remove the tab using its stored tabId
                tab.remove(); // Remove the tab's UI element
            });

            const tabcounter = document.getElementById("tabcount");
            tabcountforselect -= selectedTabs.length;
            tabcounter.innerHTML = tabcountforselect + " Tabs open";

            selectedTabs = []; // Clear the selected tabs array
            // resetSelectionMode();
        }
    });

    function toggleTabSelection(event) {
        event.preventDefault();
        const tabElement = event.currentTarget;
        tabElement.classList.toggle("selected");
        if (tabElement.classList.contains("selected")) {
            selectedTabs.push(tabElement);
        } else {
            const tabIndex = selectedTabs.indexOf(tabElement);
            if (tabIndex !== -1) {
                selectedTabs.splice(tabIndex, 1);
            }
        }
    }

    function resetSelectionMode() {
        const tabElements = document.querySelectorAll(".tabss");
        tabElements.forEach(tabElement => {
            tabElement.classList.remove("selected");
            tabElement.removeEventListener("click", toggleTabSelection);
        });

        tabcountforselect = originalTabCount;
        isSelectionMode = false;
    }



    // most visited website
    const findMostVisitedSiteInPastWeek = () => {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 1);

        chrome.history.search({ text: '', startTime: oneWeekAgo.getTime(), maxResults: 100 }, function (historyItems) {
            if (historyItems.length > 0) {
                let mostVisitedUrl = historyItems[0].url;
                let highestVisitCount = historyItems[0].visitCount;
                console.log(historyItems)
                // Find the most visited URL based on visit count
                for (const historyItem of historyItems) {
                    if (historyItem.visitCount > highestVisitCount) {
                        mostVisitedUrl = historyItem.url;
                        highestVisitCount = historyItem.visitCount;
                    }
                }

                // Highlight the most visited tab based on data-url attribute
                console.log(mostVisitedUrl);
                console.log(highestVisitCount);
                const tabItems = document.getElementsByClassName("tabss");
                for (const tabItem of tabItems) {
                    if (tabItem.getAttribute("data-url") === mostVisitedUrl) {
                        tabItem.classList.add("most-visited");
                    } else {
                        tabItem.classList.remove("most-visited");
                    }
                }
            }
        });

    };


    // sort variable
    let isSorted = false;
    // search vairable
    let searchTerm = "";
    //Search bar for tabs
    const searchInput = document.getElementById("searchInput");
    const searchResults = document.getElementById("searchResults");
    const tabList = document.getElementsByClassName("tabss");
    const tabcounter = document.getElementById("tabcount");
    // Add event listener for the input event (typing)
    searchInput.addEventListener("input", () => {
        searchTerm = searchInput.value.toLowerCase();
        // console.log(searchInput.value.toLowerCase());
        // const sortedtitles = document.getElementsByClassName("group-title");
        filterTabs(searchTerm);
        const groupTitles = document.querySelectorAll(".group-title");
        for (const groupTitle of groupTitles) {
            if (searchTerm && searchTerm.trim() !== "") {
                groupTitle.style.display = "none";
            } else {
                groupTitle.style.display = "block";
            }
        }
    });

    // Filter tabs based on the given search term
    function filterTabs(term) {
        let matchingTabCount = 0;

        for (const tabItem of tabList) {
            const tabText = tabItem.textContent.toLowerCase();
            // console.log(tabText);
            if (tabText.includes(term)) {
                tabItem.style.display = "block";

                matchingTabCount++;
            } else {
                tabItem.style.display = "none";
            }
        }
        searchResults.textContent = `Found ${matchingTabCount} matching tabs.`;
        if (searchInput.value.toLowerCase() === "") {
            tabcounter.style.display = "block";
        }
        else {
            tabcounter.style.display = "none";
        }
    }
    //Group the tabs
    // Function to extract domain name from URL
    function getDomainNameFromURL(url) {
        if (!url) {
            console.error('Invalid URL:', url);
            return null;
        }

        const parsedUrl = new URL(url);
        const domainName = parsedUrl.hostname.replace('www.', '');

        // Assuming the URL format is "www.geeksforgeeks.org" or "geeksforgeeks.org"
        // Extract "geeksforgeeks" from the domain
        // const domainParts = domainName.split('.');
        // if (domainParts.length > 1 && domainParts[0] === "www") {
        //     return domainParts[1];
        // }
        return domainName;
    }

    function groupTabsByDomain(tabs) {
        const tabGroups = {};

        tabs.forEach(tab => {
            const domainName = getDomainNameFromURL(tab.url);

            if (!tabGroups[domainName]) {
                tabGroups[domainName] = [];
            }

            tabGroups[domainName].push(tab);
        });
        const tabGroupsArray = Object.entries(tabGroups);
        tabGroupsArray.sort((a, b) => {
            return a[0].localeCompare(b[0]);
        });
        const sortedTabGroups = {};
        tabGroupsArray.forEach(([domainName, tabs]) => {
            sortedTabGroups[domainName] = tabs;
        });
        return sortedTabGroups;
    }

    // Function to sort tabs by URL within each group
    function sortTabsByURL(tabGroups) {
        for (const domain in tabGroups) {
            tabGroups[domain].sort((a, b) => {
                return a.url.localeCompare(b.url);
            });
        }
    }
    let allTabs1 = [];



    // Add the sort button functionality
    const sortButton = document.getElementById("sortButton");
    sortButton.addEventListener("click", async function () {
        try {
            const response = await new Promise((resolve, reject) => {
                chrome.runtime.sendMessage({ type: "gettabs" }, response => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                    } else {
                        resolve(response);
                    }
                });
            });
            console.log(response);
            allTabs1 = response;

            let tab_count = 0;
            const taborganizer = document.getElementById('taborganizer');
            const tabcount = document.getElementById('tabcount');
            let arr = [];
            const tabGroups = groupTabsByDomain(response);
            if (isSorted) {
                // Clear previous content
                taborganizer.innerHTML = '';

                // Iterate through the unsorted tab groups and create UI elements

                response.forEach(tab => {
                    // Create UI elements for each unsorted tab within the group
                    // ... (your existing code to create tab elements goes here)
                    tab_count++;
                    console.log(tab.url);
                    const item = document.createElement("span");
                    item.classList.add("tabss");
                    item.setAttribute("data-url", tab.url);
                    item.setAttribute("data-tab-id", tab.id);
                    // Create an <img> element for the favicon
                    if (tab.favIconUrl) {
                        const icon = document.createElement("img");
                        icon.src = tab.favIconUrl;
                        icon.classList.add("tab-icon"); // Apply necessary styling
                        item.appendChild(icon);
                    }

                    // Create a <span> for the tab title
                    const titleSpan = document.createElement("span");
                    titleSpan.innerText = tab.title;
                    item.appendChild(titleSpan);

                    //Close button
                    const closeButton = document.createElement("button");
                    closeButton.innerText = "Close";
                    closeButton.classList.add("close-button");

                    // Add event listener to close the tab when the button is clicked
                    closeButton.addEventListener("click", function (event) {
                        event.stopPropagation(); // Prevent the click event from propagating to the tab
                        chrome.tabs.remove(tab.id);
                        item.remove(); // Remove the tab's item from the list
                        tab_count--;
                        tabcount.innerHTML = tab_count + " Tabs open";
                    });

                    item.appendChild(closeButton);

                    item.classList.add("tabs");
                    if (tab.active) {
                        item.classList.add("active");
                    }

                    item.addEventListener("click", function (event) {
                        // event.stopPropagation();
                        if (!isSelectionMode)
                            chrome.tabs.update(tab.id, { active: true });
                        // window.close();
                    });

                    console.log(item);
                    taborganizer.appendChild(item);
                });

                findMostVisitedSiteInPastWeek();
                // Display total tab count
                tabcount.innerHTML = allTabs1.length + " Tabs open";

                isSorted = false;
            } else {
                // Sort tabs by URL
                sortTabsByURL(tabGroups);

                // Clear previous content
                taborganizer.innerHTML = '';

                // Iterate through the sorted tab groups and create UI elements
                for (const domain in tabGroups) {
                    const tabGroup = tabGroups[domain];

                    const groupTitle = document.createElement("div");
                    groupTitle.innerText = domain;
                    groupTitle.classList.add("group-title");
                    // if (searchTerm === "") {
                    //     groupTitle.style.display = "block"; // Display the group title
                    // } else {
                    //     groupTitle.style.display = "none"; // Hide the group title during search
                    // }
                    taborganizer.appendChild(groupTitle);

                    tabGroup.forEach(tab => {
                        // Create UI elements for each sorted tab within the group
                        // ... (your existing code to create tab elements goes here)
                        tab_count++;
                        console.log(tab.url);
                        const item = document.createElement("span");
                        item.classList.add("tabss");
                        item.setAttribute("data-url", tab.url);
                        item.setAttribute("data-tab-id", tab.id);
                        // Create an <img> element for the favicon
                        if (tab.favIconUrl) {
                            const icon = document.createElement("img");
                            icon.src = tab.favIconUrl;
                            icon.classList.add("tab-icon"); // Apply necessary styling
                            item.appendChild(icon);
                        }

                        // Create a <span> for the tab title
                        const titleSpan = document.createElement("span");
                        titleSpan.innerText = tab.title;
                        item.appendChild(titleSpan);

                        //Close button
                        const closeButton = document.createElement("button");
                        closeButton.innerText = "Close";
                        closeButton.classList.add("close-button");

                        // Add event listener to close the tab when the button is clicked
                        closeButton.addEventListener("click", function (event) {
                            event.stopPropagation(); // Prevent the click event from propagating to the tab
                            chrome.tabs.remove(tab.id);
                            item.remove(); // Remove the tab's item from the list
                            tab_count--;
                            tabcount.innerHTML = tab_count + " Tabs open";
                        });

                        item.appendChild(closeButton);

                        item.classList.add("tabs");
                        if (tab.active) {
                            item.classList.add("active");
                        }

                        item.addEventListener("click", function (event) {
                            // event.stopPropagation();
                            if (!isSelectionMode)
                                chrome.tabs.update(tab.id, { active: true });
                            // window.close();
                        });

                        // console.log(item);
                        taborganizer.appendChild(item);

                    });
                }
                findMostVisitedSiteInPastWeek();

                // Display total tab count
                tabcount.innerHTML = allTabs1.length + " Tabs open (Sorted)";

                isSorted = true;
            }
        } catch (error) {
            console.error('Error:', error);
        }

    });

    // Button to trigger tab segregation
    let allTabs = []
    chrome.runtime.sendMessage({ type: "gettabs" }, function (response) {
        console.log(response);
        allTabs = response;

        let tab_count = 0;
        const taborganizer = document.getElementById('taborganizer');
        const tabcount = document.getElementById('tabcount');
        let arr = [];
        // let groupedtabs = grouptabs(response);
        response.forEach((tab, index) => {
            tab_count++;
            console.log(tab.url);
            const item = document.createElement("span");
            item.classList.add("tabss");
            item.setAttribute("data-url", tab.url);
            item.setAttribute("data-tab-id", tab.id);
            // Create an <img> element for the favicon
            if (tab.favIconUrl) {
                const icon = document.createElement("img");
                icon.src = tab.favIconUrl;
                icon.classList.add("tab-icon"); // Apply necessary styling
                item.appendChild(icon);
            }

            // Create a <span> for the tab title
            const titleSpan = document.createElement("span");
            titleSpan.innerText = tab.title;
            item.appendChild(titleSpan);

            //Close button
            const closeButton = document.createElement("button");
            closeButton.innerText = "Close";
            closeButton.classList.add("close-button");

            // Add event listener to close the tab when the button is clicked
            closeButton.addEventListener("click", function (event) {
                event.stopPropagation(); // Prevent the click event from propagating to the tab
                chrome.tabs.remove(tab.id);
                item.remove(); // Remove the tab's item from the list
                tab_count--;
                tabcount.innerHTML = tab_count + " Tabs open";
            });

            item.appendChild(closeButton);

            item.classList.add("tabs");
            if (tab.active) {
                item.classList.add("active");
            }

            item.addEventListener("click", function (event) {
                // event.stopPropagation();
                if (!isSelectionMode)
                    chrome.tabs.update(tab.id, { active: true });
                // window.close();
            });

            console.log(item);
            taborganizer.appendChild(item);
        });
        findMostVisitedSiteInPastWeek();

        tabcount.innerHTML = tab_count + " Tabs open";
    });

});