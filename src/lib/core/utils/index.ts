/**
 *
 * @param { string } name 文件名称
 * @returns { string } 后缀名
 */
export const getSuffixName = (name) => {
  const splits = name.split(".");
  return splits[splits.length - 1];
};

export function Uint8ArrayToString(fileData) {
  let dataString = "";
  for (let i = 0; i < fileData.length; i++) {
    dataString += String.fromCharCode(fileData[i]);
  }

  return dataString;
}

export async function largeUint8ArrayToString(uint8arr): Promise<string> {
  return new Promise((resolve) => {
    const blob = new Blob([uint8arr]);
    const reader = new FileReader();
    reader.onload = function (e) {
      resolve(e.target.result as string);
    };
    reader.readAsText(blob);
  });
}

export const b64toBlob = (b64Data, contentType = "", sliceSize = 512) => {
  const byteCharacters = atob(b64Data);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);

    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  const blob = new Blob(byteArrays, { type: contentType });
  return blob;
};

export const splitb64 = (str: string): { b64Data: string; contentType: string } => {
  const prefix = str.split(";")[0];
  const contentType = prefix.split("data:")[1];
  const b64Data = str.split(",")[1];
  return {
    b64Data,
    contentType,
  };
};
