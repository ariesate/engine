export const content = `%2F**%20%40jsx%20createElement%20*%2F%0Aimport%20%7B%20createElement%2C%20render%7D%20from%20'axii'%0Aimport%20Button%20from%20'..%2Fsrc%2Fbutton%2FButton.jsx'%0A%0Afunction%20App()%20%7B%0A%09return%20(%0A%09%09%3Cdiv%3E%0A%09%09%09%3Cdiv%3E%0A%09%09%09%09%3CButton%3Enormal%3C%2FButton%3E%0A%09%09%09%09%3CButton%20primary%3Eprimary%3C%2FButton%3E%0A%09%09%09%09%3CButton%20danger%3Edanger%3C%2FButton%3E%0A%09%09%09%09%3CButton%20primary%20disabled%3Eprimary%20disabled%3C%2FButton%3E%0A%09%09%09%09%3CButton%20danger%20disabled%3Edanger%20disabled%3C%2FButton%3E%0A%09%09%09%3C%2Fdiv%3E%0A%09%09%09%3Cdiv%3E%0A%09%09%09%09%3CButton%20primary%20size%3D%22large%22%3Eprimary%20big%3C%2FButton%3E%0A%09%09%09%3C%2Fdiv%3E%0A%09%09%09%3Cdiv%3E%0A%09%09%09%09%3CButton%20primary%20size%3D%22small%22%3Eprimary%20small%3C%2FButton%3E%0A%09%09%09%3C%2Fdiv%3E%0A%09%09%3C%2Fdiv%3E%0A%09)%0A%7D%0A%0A%0Arender(%3CApp%20%2F%3E%2C%20document.getElementById('root'))%0A`