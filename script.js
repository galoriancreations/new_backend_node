console.log('script loaded!')

const sendWebContent = (text)=>{

    fetch('/sendMessage',{
        headers:{'Accept':'application/json','Content-Type':'application/json'},
        method:'POST',
        body:JSON.stringify({
            mText:text
        })
    })
    .then(res=>res.json())
    .then((data)=>{
        document.querySelector('result').innerHTML = `message to ${data.mText} was sent!`
    })
    .catch((err)=>{if(err) throw err})
}

