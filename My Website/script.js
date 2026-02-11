var fileInput = document.getElementById('fileInput')
var chooseBtn = document.getElementById('chooseBtn')
var dropzone = document.getElementById('dropzone')
var preview = document.getElementById('preview')
var convertBtn = document.getElementById('convertBtn')
var copyBtn = document.getElementById('copyBtn')
var statusEl = document.getElementById('status')
var output = document.getElementById('output')
var language = document.getElementById('language')
var currentFile = null

function setStatus(msg) {
  statusEl.textContent = msg
}

chooseBtn.addEventListener('click', function () {
  fileInput.click()
})

fileInput.addEventListener('change', function (e) {
  if (!e.target.files || !e.target.files[0]) return
  loadFile(e.target.files[0])
})

dropzone.addEventListener('dragover', function (e) {
  e.preventDefault()
  dropzone.classList.add('dragover')
})

dropzone.addEventListener('dragleave', function () {
  dropzone.classList.remove('dragover')
})

dropzone.addEventListener('drop', function (e) {
  e.preventDefault()
  dropzone.classList.remove('dragover')
  var dt = e.dataTransfer
  if (!dt || !dt.files || !dt.files[0]) return
  loadFile(dt.files[0])
})

function loadFile(file) {
  currentFile = file
  var url = URL.createObjectURL(file)
  preview.src = url
  preview.onload = function () { URL.revokeObjectURL(url) }
  convertBtn.disabled = false
  setStatus('Ready to convert')
}

convertBtn.addEventListener('click', function () {
  if (!currentFile) return
  output.value = ''
  copyBtn.disabled = true
  setStatus('Starting OCR')
  Tesseract.recognize(currentFile, language.value, { logger: function (m) {
    if (m && typeof m.progress === 'number') {
      var pct = Math.round(m.progress * 100)
      setStatus(m.status + ' ' + pct + '%')
    } else if (m && m.status) {
      setStatus(m.status)
    }
  } }).then(function (res) {
    var text = res.data && res.data.text ? res.data.text : ''
    var notes = toNotes(text)
    output.value = notes
    copyBtn.disabled = notes.length === 0
    setStatus('Done')
  }).catch(function (err) {
    setStatus('Error: ' + (err && err.message ? err.message : 'Failed'))
  })
})

copyBtn.addEventListener('click', function () {
  if (!output.value) return
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(output.value).then(function () {
      setStatus('Copied to clipboard')
    }).catch(function () {
      setStatus('Copy failed')
    })
  } else {
    output.select()
    document.execCommand('copy')
    setStatus('Copied to clipboard')
  }
})

function toNotes(text) {
  var lines = String(text).split(/\r?\n/)
  var clean = []
  for (var i = 0; i < lines.length; i++) {
    var s = lines[i].trim()
    if (!s) continue
    if (/^[\-\*•]+\s*/.test(s)) s = s.replace(/^[\-\*•]+\s*/, '')
    clean.push('- ' + s)
  }
  return clean.join('\n')
}
