import { readFileSync, writeFileSync } from "node:fs";
import { Paragraph, PatchType, TextRun, patchDocument } from "docx";
import libreoffice from "libreoffice-convert";

export function readTemplateFile(track, level) {
	return readFileSync(`${process.cwd()}/templates/${track} ${level}.docx`);
}

export async function fillTemplate(document, data) {
	let workshopsIntro = [];
	let workshopParagraphs = [];

	if (data.workshops.length > 0) {
		// Add intro paragraph if workshops were attended
		workshopsIntro.push(
			new TextRun({
				text: `${data.firstName} also took part in workshops with the following companies: `,
				font: "Quicksand",
				size: "10pt",
				color: "000000",
			})
		);
	}

	if (data.workshops.length > 0) {
		// Add bullet point for each workshop
		for (let workshop of data.workshops) {
			workshopParagraphs.push(
				new Paragraph({
					bullet: { level: 0 },
					children: [
						new TextRun({
							text: workshop,
							font: "Quicksand",
							size: "10pt",
							color: "000000",
						}),
					],
				})
			);
		}
	}

	return await patchDocument(document, {
		patches: {
			name: {
				type: PatchType.PARAGRAPH,
				children: [
					new TextRun({
						text: data.name,
						font: "Quicksand",
						size: "14pt",
						color: "2F5496",
						bold: true,
					}),
				],
			},
			vorname: {
				type: PatchType.PARAGRAPH,
				children: [
					new TextRun({
						text: data.firstName,
						font: "Quicksand",
						size: "10pt",
						color: "000000",
					}),
				],
			},
			track: {
				type: PatchType.PARAGRAPH,
				children: [
					new TextRun({
						text: data.trackEn,
						font: "Quicksand",
						size: "14pt",
						color: "2F5496",
						bold: true,
					}),
				],
			},
			// Show only the workshops paragraph if workshops were attended
			...(data.workshops?.length > 0
				? {
						workshops: {
							type: PatchType.PARAGRAPH,
							children: workshopsIntro,
						},
				  }
				: {
						workshops: {
							type: PatchType.PARAGRAPH,
							children: [],
						},
				  }),
			// Show only the workshops list if workshops were attended
			...(data.workshops?.length > 0
				? {
						workshopsList: {
							type: PatchType.DOCUMENT,
							children: workshopParagraphs,
						},
				  }
				: {
						workshopsList: {
							type: PatchType.DOCUMENT,
							children: [],
						},
				  }),
			date: {
				type: PatchType.PARAGRAPH,
				children: [
					new TextRun({
						text: new Date().toLocaleDateString("de-DE"),
						font: "Quicksand",
						size: "10pt",
						color: "000000",
						bold: true,
					}),
				],
			},
		},
	});
}

export async function generateCertificate(document, fileName) {
	const wordPath = `${process.cwd()}/certificates/docx/${fileName}.docx`;
	const pdfPath = `${process.cwd()}/certificates/pdf/${fileName}.pdf`;

	writeFileSync(wordPath, document);

	convertToPdf(wordPath, pdfPath);
}

function convertToPdf(wordPath, pdfPath) {
	const file = readFileSync(wordPath);
	libreoffice.convert(file, ".pdf", undefined, (err, doc) => {
		if (err) {
			console.log(`Error converting file: ${err}`);
		}

		writeFileSync(pdfPath, doc);
	});
}