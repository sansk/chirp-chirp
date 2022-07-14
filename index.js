const dotenv = require("dotenv");
const { TwitterApi } = require("twitter-api-v2");
const jimp = require("jimp");
const axios = require("axios");
const twemoji = require('twemoji');
const mergeImg = require('merge-img');
const fs = require('fs');

dotenv.config();
const emojis = require('./resources/emoji-compact.json');

const client = new TwitterApi({
    appKey: process.env.APP_KEY,
    appSecret: process.env.APP_SECRET,
    accessToken: process.env.ACCESS_TOKEN,
    accessSecret: process.env.ACCESS_SECRET,
});

let followersList = [];
let userId = '';
let latestBlogHdl = '';

const getLatestTweetReaction = async () => {
    let emoijString = [];
    function getEmojis(input) {
        return emojis
            .filter((e) => input.indexOf(e) > -1)
            .map((e) => twemoji.convert.toCodePoint(e));
    }
    const userReplyMention = await client.v2.userMentionTimeline(userId, { max_results: 50 });
    userReplyMention.data.data.forEach((i) => {
        i.text && emoijString.unshift(...getEmojis(i.text));
    });

    let emojiImg = emoijString.map((name) => `./resources/emojiList_72x72/${name}.png`)
        .filter((path) => fs.existsSync(path)).reverse();

    emojiImg.length > 10 && emojiImg.splice(10);

    await mergeImg(emojiImg, { direction: true })
        .then(img => {
            img.write("./resources/chirp/emoji.png", () => {
                console.log("Emoji Image Created.");
            });
        });

    return "Done with Emojis";
}

const getLatestArticleHeadline = async () => {
    let title = "Sorry! Can't fetch Latest title";
    let result = '';
    await axios.post('https://api.hashnode.com/', {
        headers: {
            'Content-Type': 'application/json',
        },
        query: `query GetUserArticles($page: Int!) {
            user(username: "${process.env.HN_USR_NAME}") {
              publication {
                posts(page: $page) {
                   title
                }
              }
            }
          }`,
        variables: { page: 0 }
    }).then(response => {
        (result = response.data.data.user.publication.posts[0].title).length > 35 ? title = `${result.substring(0, 35)}...` : title = result;
    });
    return title;
}

const getFollowerDetails = async () => {
    const followers = await client.v2.followers(userId, { max_results: 3 });
    return followers.data.map((follower) => follower.username);
}

const drawBanner = async () => {
    // const font = await jimp.loadFont(jimp.FONT_SANS_32_WHITE);
    // const fontSmall = await jimp.loadFont(jimp.FONT_SANS_16_WHITE);
    const font = await jimp.loadFont(jimp.FONT_SANS_32_BLACK);
    //const fontSmall = await jimp.loadFont(jimp.FONT_SANS_16_BLACK);

    const drawImageInBanner = (type, mask, drawPos_X, drawPos_Y) => {
        type === 'follower' ? (mask.resize(60, 60), mask.circle()) : mask.resize(45, 385);
        banner.composite(mask, drawPos_X, drawPos_Y);
    }

    const writeInBanner = (font, writePos_X, writePos_Y, text) => {
        banner.print(font, writePos_X, writePos_Y, text);
    }

    const deleteImages = () => {
        try {
            console.log('Removing Images.');
            fs.unlinkSync(`./resources/chirp/${followersList[0]}.png`);
            fs.unlinkSync(`./resources/chirp/${followersList[1]}.png`);
            fs.unlinkSync(`./resources/chirp/${followersList[2]}.png`);
            // fs.unlinkSync(`./resources/chirp/emoji.png`);
            // fs.unlinkSync(`./resources/chirp/finalBanner.png`);
        } catch (e) {
            console.log(e);
        }
    }

    const banner = await jimp.read("./resources/banner.png");
    banner.resize(1500, 500);

    // Recent Followers Picture update to banner
    drawImageInBanner('follower', await jimp.read(`./resources/chirp/${followersList[0]}.png`), 70, 80);
    drawImageInBanner('follower', await jimp.read(`./resources/chirp/${followersList[1]}.png`), 70, 145);
    drawImageInBanner('follower', await jimp.read(`./resources/chirp/${followersList[2]}.png`), 70, 210);

    // followersList.map((item, i) => {
    //     let x = 135,
    //         y = 100;

    //     writeInBanner(fontSmall, x, y + (i * 65), item);
    // });

    // Update the Latest Blog Headline
    writeInBanner(font, 425, 440, latestBlogHdl);

    // Update the Latest Tweet Reactions
    drawImageInBanner('emoji', await jimp.read(`./resources/chirp/emoji.png`), 1450, 40);

    banner.write("./resources/chirp/finalBanner.png", async () => {
        // Comment the below statement while testing. Uncomment to make your profile banner LIVE!
        await client.v1.updateAccountProfileBanner("./resources/chirp/finalBanner.png");
        console.log("Banner Uploaded.");
        deleteImages();
    });
}

const init = async () => {
    //const me = await client.v2.userByUsername('sangyk_dev');
    const me = await client.v2.userByUsername(process.env.TWITTER_HANDLE);
    userId = me.data.id;

    //Getting Latest Tweet Reactions from twitter
    const latestTweetReaction = await getLatestTweetReaction();

    //Getting Latest Blog post from hashnode
    latestBlogHdl = await getLatestArticleHeadline()

    //Getting Latest Followers List from Twitter
    followersList = await getFollowerDetails();

    const savePic = async (username) => {
        const URL = `https://unavatar.io/twitter/${username}`;
        const image = await jimp.read(URL);
        image.write(`./resources/chirp/${username}.png`);
    };

    Promise.all(followersList.map(savePic)).then(drawBanner)
}

init();
