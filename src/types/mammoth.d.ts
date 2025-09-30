// TypeScript declaration for global window.mammoth
interface Mammoth {
  convertToPlainText(options: { arrayBuffer: ArrayBuffer }): Promise<{ value: string }>;
}

interface Window {
  mammoth?: Mammoth;
}

declare var mammoth: Mammoth;
