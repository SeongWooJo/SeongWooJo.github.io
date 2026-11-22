export interface CoverImageOptions {
  /** 대표 이미지를 적는 프론트매터 키 */
  key?: string
  /** 넣는 이미지의 대체 텍스트 (스타일을 붙이는 기준으로도 쓴다) */
  alt?: string
}
export declare const CoverImage: (opts?: CoverImageOptions) => any
