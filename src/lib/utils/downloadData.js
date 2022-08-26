const downloadData = (url, type) => {
  return new Promise((resolve, reject) => {
    var xhr = new XMLHttpRequest();
    xhr.responseType = type;
    xhr.onreadystatechange = function () {
      if (xhr.readyState == 4) {
        var status = xhr.status;
        if (status >= 200 && status < 300) {
          resolve(xhr.response);
        } else {
          reject(status);
        }
      }
    };
    xhr.open("GET", url, true);
    xhr.send(null);
  });
};

export { downloadData };
