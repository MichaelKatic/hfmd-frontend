const get = (url) => {
    const xhttp = new XMLHttpRequest()
    xhttp.open('GET', url, false)
    xhttp.send()
    return JSON.parse(xhttp.responseText)
}

const getPromise = (url) => new Promise((resolve, reject) => {
    const response = get(url)
    if (response.error)
    {
        response.url = url
        reject(response)
    }
    resolve(response)

    // jq.ajax(
    //     { 
    //       type: "GET",
    //       url: url,
    //       dataType: 'application/json',
    //     //   xhrFields: {
    //     //        withCredentials: true
    //     //   },
    //       crossDomain: true,
    //     //   beforeSend: function(xhr) {
    //     //         xhr.setRequestHeader("Cookie", "session=xxxyyyzzz");
    //     //   },
    //       success: function(data){
    //             console.log('data', data)
    //            alert('success');
    //            resolve(data)
    //       },
    //       error: function (xhr) {
    //              reject(xhr.responseText);
    //       }
    //     }
    // );
    
    // const options = {
    //     headers: {
    //         accept: 'application/json',
    //     }
    // }
    // https.get(url, options, (res) => {
    //     console.log('statusCode:', res.statusCode);
    //     console.log('headers:', res.headers);

    //     res.on('data', (d) => {
    //         process.stdout.write(d);
    //     });

    //     res.setEncoding('utf8');
    //     let rawData = '';

    //     res.on('data', (chunk) => {
    //         rawData += chunk;
    //     });

    //     res.on('end', () => {
    //         try {
    //             const parsedData = JSON.parse(rawData);
    //             if (res.statusCode >= 200 && res.statusCode < 300) {
    //                 resolve(parsedData);
    //             } else {
    //                 reject(parsedData.error);
    //             }
    //         } catch (error) {
    //             reject(error);
    //         }
    //     });

    // }).on('error', (error) => {
    //     reject(error);
    // });
});

export default {
    get,
    getPromise
}