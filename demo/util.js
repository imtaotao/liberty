exports.notice = function (msg, time) {
  if (isNaN(time)) {
    time = 1500
  }

  const noticeCompnent = document.createElement('div')
  noticeCompnent.innerHTML = msg
  noticeCompnent.className = 'notice'

  document.body.appendChild(noticeCompnent)

  setTimeout(() => {
    noticeCompnent.style.webkitTransition = '-webkit-transform 0.5s ease-in, opacity 0.5s ease-in'
    noticeCompnent.style.opacity = '0'
    setTimeout(() => document.body.removeChild(noticeCompnent), 500)
  }, time)
}

exports.deepClone = function (data) {
  return JSON.parse(JSON.stringify(data))
}

exports.changeUserInfor = function (data) {
  localStorage.setItem('User', JSON.stringify(exports.deepClone(data)))
}