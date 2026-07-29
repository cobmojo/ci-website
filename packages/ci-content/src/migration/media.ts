import type { MediaDisposition } from '@ci/content-schema'

/**
 * Disposition of every embedded image in the source document.
 *
 * The DOCX package contains eight media assets. None is reproduced as an
 * image on the public site. Where an image carried argument, that argument is
 * rebuilt as text, a semantic table or an accessible SVG, because a screenshot
 * cannot be read by assistive technology, searched, translated or checked.
 */
export const MEDIA_DISPOSITIONS: readonly MediaDisposition[] = [
  {
    file: 'image1.png',
    description:
      'Table of four two-outcome games with their win and loss amounts, used in Appendix 1 to show how outcome size shapes assumed odds.',
    treatment: 'rebuilt-as-semantic-html',
    destination: '/appendix/afterlife-odds/',
    rightsStatus: 'cleared',
    note: 'Rebuilt as a semantic table with a caption and explicit column headers, with the zero-sum assumption stated in prose. The original conveyed comparisons partly through relative bar size, which carried no text alternative.',
  },
  {
    file: 'image6.png',
    description:
      'Chart of the presumed odds for each of the four games under a zero-sum assumption.',
    treatment: 'rebuilt-as-accessible-svg',
    destination: '/appendix/afterlife-odds/',
    rightsStatus: 'cleared',
    note: 'Rebuilt as an accessible SVG with text labels inside the graphic and an equivalent data table immediately beneath it. Nothing is distinguished by colour alone.',
  },
  {
    file: 'image2.png',
    description: 'Screenshot comparing the Greek of Revelation 4:8 with Revelation 14:11.',
    treatment: 'rebuilt-as-semantic-html',
    destination: '/case/key-texts/revelation-14/',
    rightsStatus: 'paraphrased',
    note: 'Replaced with real text. Both verses are quoted in full from the public-domain corpus and the verbal parallel is described in words. Because the detailed comparison could not be reconstructed from the image with confidence, the page states the parallel only at the level the text supports and carries a specialist-review-pending status.',
  },
  {
    file: 'image3.png',
    description: 'Second screenshot in the Revelation 4:8 and 14:11 Greek comparison.',
    treatment: 'rebuilt-as-semantic-html',
    destination: '/case/key-texts/revelation-14/',
    rightsStatus: 'paraphrased',
    note: 'Handled together with image2.png. An argument that exists only inside a screenshot cannot be checked by a reader, so it is not carried forward in that form.',
  },
  {
    file: 'image8.jpg',
    widthPx: 1280,
    heightPx: 720,
    description: 'Thumbnail for the 28-minute video overview.',
    treatment: 'used-as-poster',
    destination: '/watch/',
    rightsStatus: 'cleared',
    note: 'The author owns the video. A restrained text-and-type poster is used instead of the fire-themed thumbnail so that the site’s visual identity is not built around flame imagery. The original title is preserved in the video metadata and on the watch page.',
  },
  {
    file: 'image5.png',
    description: 'QR code encoding the shortened URL for the shared working document.',
    treatment: 'regenerated',
    destination: '/download/',
    rightsStatus: 'not-applicable',
    note: 'A QR code is of no use on a page the reader is already viewing. A newly generated code encoding the canonical site URL appears only on the printable handout and print cover sheet. The original short link is retired.',
  },
  {
    file: 'image4.png',
    description: 'Raster YouTube play button placed over the video thumbnail.',
    treatment: 'replaced-with-icon-system',
    destination: '/watch/',
    rightsStatus: 'not-applicable',
    note: 'Replaced with an original inline SVG play control that scales cleanly, carries an accessible name, and is fully keyboard operable.',
  },
  {
    file: 'image7.png',
    description:
      'Small screenshot of the word processor’s document-outline toolbar icon, used in a note telling desktop readers how to open the outline pane.',
    treatment: 'omitted-formatting-artifact',
    rightsStatus: 'not-applicable',
    note: 'Interface debris from the authoring tool rather than content. The underlying need, moving quickly between sections, is met by the chapter navigation, the on-this-page list and the case map.',
  },
]
