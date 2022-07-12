// 1. Simplest way - To use xml2js parser to convert xml fetched from medium feed to json
// Install xml2js npm package - npm install xml2js
const xml2js = require("xml2js");
const getLatestArticleHeadline_1 = async () => {
    let title = "Sorry! Can't fetch Latest title";
    let result = '';
    await axios.get(`https://medium.com/feed/@${process.env.mediumUsrName}`)
        .then(response => {
            const parser = new xml2js.Parser();
            parser.parseString(response.data, function (err, res) {
                console.dir(res.rss.channel[0].item[0].title[0]);
                (result = res.rss.channel[0].item[0].title[0]).length > 60 ? title = `${result.substring(0, 60)}...` : title = result;
            });
        });
    return title;
}

// 2. Using regex pattern to extract the title from the xml
// Regex Used: <title><!\[CDATA\[(?!Stories by)(.*)\]\]><\/title>
// More details about RegEx exec() - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/exec
// RegEx Playground: https://regex101.com/r/COvTSV/1
const getLatestArticleHeadline_2 = async () => {
    let title = "Sorry! Can't fetch Latest title";
    let result = '';
    const regEx = /<title><!\[CDATA\[(?!Stories by)(.*)\]\]><\/title>/g;
    await axios.get(`https://medium.com/feed/@${process.env.mediumUsrName}`)
        .then(response => {
            result = regEx.exec(response.data);
            console.log(result[1]);
            result[1].length > 60 ? title = `${result[1].substring(0, 60)}...` : title = result[1];
        });
    return title;
}

// 3. Using RapidAPI - Use the unofficial medium api
// Get registered to RapidAPI & then Subscribe to https://rapidapi.com/nishujain199719-vgIfuFHZxVZ/api/medium2 to get the api key
// They have a limit of 250 request/month - Roughly 8 Requests per day. Above this you need to pay.
// NOT TESTED BY ME.
const getLatestArticleHeadline_3 = async () => {
    let title = "Sorry! Can't fetch Latest title";
    let mediumUsrId = '';
    let mediumArticleId = '';
    await axios.request({
        method: 'GET',
        url: `https://medium2.p.rapidapi.com/user/id_for/${process.env.mediumUsrName}`,
        headers: {
            "x-rapidapi-host": 'medium2.p.rapidapi.com',
            "x-rapidapi-key": process.env.rapidApiKey
        }
    }).then(response => {
        mediumUsrId = response.data.id;
    });
    await axios.request({
        method: 'GET',
        url: `https://medium2.p.rapidapi.com/user/${mediumUsrId}/articles`,
        headers: {
            "x-rapidapi-host": 'medium2.p.rapidapi.com',
            "x-rapidapi-key": process.env.rapidApiKey
        }
    }).then(response => {
        mediumArticleId = response.data.associated_articles[0];
    });
    await axios.request({
        method: 'GET',
        url: `https://medium2.p.rapidapi.com/article/${mediumArticleId}`,
        headers: {
            "x-rapidapi-host": 'medium2.p.rapidapi.com',
            "x-rapidapi-key": process.env.rapidApiKey
        }
    }).then(response => {
        title = response.data.title;
    });
    return title;
}

// 4. Using JSON based oAuth2 API
// Documentation - https://github.com/Medium/medium-api-docs