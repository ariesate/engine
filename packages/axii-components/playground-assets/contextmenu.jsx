export const content = `%2F**%20%40jsx%20createElement%20*%2F%0Aimport%20%7B%20createElement%2C%20render%7D%20from%20'axii'%0Aimport%20contextmenu%20from%20'..%2Fsrc%2Fcontextmenu%2Fcontextmenu.jsx'%0A%0Afunction%20App()%20%7B%0A%09const%20openContextmenu%20%3D%20(e)%20%3D%3E%20%7B%0A%09%09e.preventDefault()%0A%09%09contextmenu.open(%3Cdiv%3E%0A%09%09%09this%20is%20context%20menu%0A%09%09%3C%2Fdiv%3E%2C%20%7Bleft%3A%20e.pageX%2C%20top%3A%20e.pageY%7D)%0A%09%7D%0A%0A%09return%20(%0A%09%09%3Cdiv%20onContextmenu%3D%7BopenContextmenu%7D%3E%0A%09%09%09Right%20click%20to%20open%20contextmenu%0A%09%09%3C%2Fdiv%3E%0A%09)%0A%7D%0A%0A%0Arender(%3CApp%20%2F%3E%2C%20document.getElementById('root'))%0A`