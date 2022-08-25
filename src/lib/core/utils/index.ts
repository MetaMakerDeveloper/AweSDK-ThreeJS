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
