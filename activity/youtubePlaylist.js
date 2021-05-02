let puppeteer = require("puppeteer");
let fs = require("fs");
let path = require("path");
let excelFn = require("./excelFn")
// No of Videos
// Total number of views
// watch time -> get
// list of video -> [name, duration] -> later in an excel
// initial page data get
// handle -> loader

let playlistURL = process.argv[2];

console.log("Before");
(async function () {
    try {
        let browserInstance = await puppeteer.launch({
            headless: false,
            defaultViewport: null,
            args: ["--start-maximized"]
        });
        newPage = await browserInstance.newPage();
        await newPage.goto(playlistURL);
        
        // show basic data
        let stats = await newPage.evaluate(consoleFn);
        console.log(playlistURL);
        console.log(stats[0]);
        console.log(stats[1]);

        // scroll to bottom
        let totalVideoCount = stats[0].split(" ")[0];
        // console.log(totalVideoCount);
        let currentVideoCount = await scrollToBottom(newPage, "#video-title");
        while(currentVideoCount < totalVideoCount - 20 ){ // Buffer value if not taken and some videos are deleted then loop will become infinite
            currentVideoCount = await scrollToBottom(newPage, "#video-title");
        }

        // get video name and duration
        // data extract
        // #video-title -- name
        // span.style-scope.ytd-thumbnail-overlay-time-status-renderer --- duration
        let videoStats = await newPage.evaluate(getVideoStats, "#video-title", "span.style-scope.ytd-thumbnail-overlay-time-status-renderer");
        // console.table(videoStats);
        let pathOfFile = path.join(__dirname, "PlayList.json");
        console.log(pathOfFile);
        if(fs.existsSync(pathOfFile) == false){
            var createStream = fs.createWriteStream(pathOfFile);
            createStream.end();
        }
        fs.writeFileSync(pathOfFile, JSON.stringify(videoStats));
        
        // write into excel file
        let pathOfExcelFile = path.join(__dirname, "PlayList.xlsx");
        console.log(pathOfExcelFile);
        excelFn.excelWriter(pathOfExcelFile, videoStats, "PlayList")

        // other approach can be using loader wait 
    } catch (err) {
        console.log(err);
    }

})();

// Function to scroll to bottom of current window
async function scrollToBottom(page, titleSelector){
    function getLengthConsoleFn(titleSelector){
        window.scrollBy(0,window.innerHeight);
        let titleArr = document.querySelectorAll(titleSelector);
        console.log("titleLength",titleArr.length);
        return titleArr.length;
    }
    return page.evaluate(getLengthConsoleFn, titleSelector);
}

// Function to find and return number of videos and views
function consoleFn() {
    let arr = document.querySelectorAll("#stats .style-scope.ytd-playlist-sidebar-primary-info-renderer");
    let stats = [];
    stats.push(arr[0].innerText, arr[1].innerText);
    return stats;
}

// Function to find and return video title and duration for all videos present on the page
function getVideoStats(nameSelector, durationSelector) {
    console.log(nameSelector , durationSelector);
    let titleArr = document.querySelectorAll(nameSelector);
    let durationArr = document.querySelectorAll(durationSelector);
    let videoStats = [];
    for(let i = 0 ; i < durationArr.length ; i++){
        let title = titleArr[i].innerText;
        let duration = durationArr[i].innerText.trim();
        videoStats.push({title, duration});
    }
    return videoStats;
}
