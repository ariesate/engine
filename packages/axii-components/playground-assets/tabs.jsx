export const content = `import%20%7B%20createElement%2C%20render%2C%20reactive%2C%20atom%20%7D%20from%20'axii'%0Aimport%20Tabs%20from%20'..%2Fsrc%2Ftabs%2FTabs.jsx'%0A%0A%0Afunction%20BrowserLike()%20%7B%0A%0A%20%20const%20urls%20%3D%20%5B%0A%20%20%20%20'http%3A%2F%2Fbaidu.com'%2C%0A%20%20%20%20'http%3A%2F%2Ftaobao.com'%2C%0A%20%20%20%20'http%3A%2F%2Fqq.com'%2C%0A%20%20%5D%0A%0A%20%20const%20activeKey%20%3D%20atom()%0A%20%20const%20openedURLs%20%3D%20reactive(%5B%5D)%0A%20%20const%20open%20%3D%20(url)%20%3D%3E%20%7B%0A%20%20%20%20if%20(!openedURLs.includes(url))%20%7B%0A%20%20%20%20%20%20openedURLs.push(url)%0A%20%20%20%20%20%20activeKey.value%20%3D%20url%0A%20%20%20%20%7D%0A%20%20%7D%0A%0A%20%20const%20close%20%3D%20(url)%20%3D%3E%20%7B%0A%20%20%20%20const%20indexOfCurrent%20%3D%20openedURLs.indexOf(url)%0A%20%20%20%20openedURLs.splice(indexOfCurrent%2C%201)%0A%20%20%20%20if%20(activeKey.value%20%3D%3D%3D%20url)%20%7B%0A%20%20%20%20%20%20activeKey.value%20%3D%20openedURLs%5B0%5D%0A%20%20%20%20%7D%0A%20%20%7D%0A%0A%20%20return%20(%0A%20%20%20%20%3Ccontainer%20block%3E%0A%20%20%20%20%20%20%3Curls%20block%3E%0A%20%20%20%20%20%20%20%20%7B%0A%20%20%20%20%20%20%20%20%20%20urls.map(url%20%3D%3E%20(%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Ca%20href%3D'%23'%20onClick%3D%7B()%20%3D%3E%20open(url)%7D%20block%3Eopen%20%20%7Burl%7D%3C%2Fa%3E%0A%20%20%20%20%20%20%20%20%20%20))%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%3C%2Furls%3E%0A%20%20%20%20%20%20%3CTabs%20activeKey%3D%7BactiveKey%7D%3E%0A%20%20%20%20%20%20%20%20%7B()%20%3D%3E%20openedURLs.map(url%20%3D%3E%20%7B%0A%20%20%20%20%20%20%20%20%20%20const%20title%20%3D%20%3CtitleBlock%20inline%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%3CtitleText%20inline%3E%7Burl%7D%3C%2FtitleText%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%3CcloseIcon%20inline%20inline-margin-left-4px%20onClick%3D%7B()%20%3D%3E%20close(url)%7D%3Ex%3C%2FcloseIcon%3E%0A%20%20%20%20%20%20%20%20%20%20%3C%2FtitleBlock%3E%0A%20%20%20%20%20%20%20%20%20%20return%20(%0A%20%20%20%20%20%20%20%20%20%20%20%20%3CTabs.TabPane%20title%3D%7Btitle%7D%20key%3D%7Burl%7D%20tabKey%3D%7Burl%7D%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3Ciframe%20src%3D%7Burl%7D%20width%3D%22100%25%22%20height%3D%7B500%7D%20%2F%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%3C%2FTabs.TabPane%3E%0A%20%20%20%20%20%20%20%20%20%20)%0A%20%20%20%20%20%20%20%20%7D)%7D%0A%20%20%20%20%20%20%3C%2FTabs%3E%0A%20%20%20%20%3C%2Fcontainer%3E%0A%20%20)%0A%7D%0A%0Arender(%3CBrowserLike%20%2F%3E%2C%20document.getElementById('root'))%0A`