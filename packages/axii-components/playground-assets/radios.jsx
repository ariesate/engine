export const content = `%2F**%20%40jsx%20createElement%20*%2F%0Aimport%20%7B%20createElement%2C%20render%2C%20atom%2C%20createComponent%20%7D%20from%20'axii'%0Aimport%20Radios%20from%20'..%2Fsrc%2Fradios%2FRadios.jsx'%0A%0Afunction%20App()%20%7B%0A%0A%09const%20value%20%3D%20atom('red')%0A%09const%20options%20%3D%20%5B'red'%2C%20'blue'%5D%0A%0A%09return%20%3Cdiv%3E%0A%09%09%3CRadios%20value%3D%7Bvalue%7D%20options%3D%7Boptions%7D%20%2F%3E%0A%09%09%3Cdiv%3E%0A%09%09%09%7B()%20%3D%3E%20%60selected%3A%20%24%7Bvalue.value%7D%60%7D%0A%09%09%3C%2Fdiv%3E%0A%09%3C%2Fdiv%3E%0A%7D%0A%0Aconst%20Fpp%20%3DcreateComponent(App)%0A%0Arender(%3CFpp%2F%3E%2C%20document.getElementById('root'))%0A`