const getLatestArticleHeadline = async () => {
    let title = "Sorry! Can't fetch Latest title";
    let result = '';
    await axios.get('https://dev.to/api/articles/me/published', {
        headers: {
            'Content-Type': 'application/json',
            'api-key': process.env.devtoApiKey,
        }
    }).then(response => (result = response.data[0].title).length > 60 ? title = `${result.substring(0, 60)}...` : title = result);
    return title;
}