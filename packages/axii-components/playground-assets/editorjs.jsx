export const content = `%2F**%20%40jsx%20createElement%20*%2F%0Aimport%20%7B%20createElement%2C%20render%2C%20useRef%20%7D%20from%20'axii'%0Aimport%20Editorjs%20from%20'..%2Fsrc%2Feditorjs%2FEditorjs.jsx'%0Aimport%20Button%20from%20'..%2Fsrc%2Fbutton%2FButton.jsx'%0A%0Afunction%20App()%20%7B%0A%20%20const%20editorRef%20%3D%20useRef()%0A%20%20const%20save%20%3D%20async%20()%20%3D%3E%20%7B%0A%20%20%20%20console.log(await%20editorRef.current.save())%0A%20%20%20%20console.log(resourceDataById)%0A%20%20%7D%0A%0A%20%20const%20resourceDataById%20%3D%20%7B%7D%0A%0A%20%20const%20collectResource%20%3D%20(id%2C%20data)%20%3D%3E%20%7B%0A%20%20%20%20resourceDataById%5Bid%5D%20%3D%20data%0A%20%20%7D%0A%0A%20%20const%20tools%20%3D%20%7B%0A%20%20%20%20table%3A%20%7B%0A%20%20%20%20%20%20class%3A%20Editorjs.TablePlugin%2C%0A%20%20%20%20%7D%2C%0A%20%20%20%20image%3A%20%7B%0A%20%20%20%20%20%20class%3A%20Editorjs.ImageEditorPlugin%2C%0A%20%20%20%20%20%20config%3A%20%7B%0A%20%20%20%20%20%20%20%20collectResource%0A%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%20%20%7D%0A%0A%20%20return%20(%3Cdiv%3E%0A%20%20%20%20%3CEditorjs%20ref%3D%7BeditorRef%7D%20tools%3D%7Btools%7D%20placeholder%3D%22%E5%86%99%E7%82%B9%E4%BB%80%E4%B9%88%E5%90%A7%22%2F%3E%0A%20%20%20%20%3CButton%20primary%20onClick%3D%7Bsave%7D%3E%E4%BF%9D%E5%AD%98%3C%2FButton%3E%0A%20%20%3C%2Fdiv%3E)%0A%7D%0A%0Arender(%3CApp%20%2F%3E%2C%20document.getElementById('root'))%0A`