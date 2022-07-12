export const randomIntFromInterval = (min: number, max: number): number => {
  const minFloor = Math.floor(min);
  const maxCeil = Math.ceil(max);

  return Math.floor(Math.random() * (maxCeil - minFloor + 1) + minFloor);
};

export const randomDecFromInterval = (min: number, max: number): number => {
  const number: number = Math.random() * (max - min) + min;

  return Number(number.toFixed(4));
};

export const saveSvg = (svgEl: string, name: string): boolean => {
  const svg = document.querySelector(svgEl);

  if (svg && name) {
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");

    const svgData = svg.outerHTML;
    const preface = '<?xml version="1.0" standalone="no"?>\r\n';
    const svgBlob = new Blob([preface, svgData], {
      type: "image/svg+xml;charset=utf-8",
    });
    const svgUrl = URL.createObjectURL(svgBlob);
    const downloadLink = document.createElement("a");

    downloadLink.href = svgUrl;
    downloadLink.download = name;
    downloadLink.target = "_blank";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    return true;
  }

  return false;
};

export const isBrowser = () => {
  return Boolean(typeof window !== "undefined");
};
