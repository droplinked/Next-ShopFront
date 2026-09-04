// CI PROOF — DO NOT MERGE.
//
// A REAL TypeScript type error, introduced to prove that `pre-merge-gate`
// reports FAILURE on a genuinely broken build. This file is inside the
// tsconfig `include` (`**/*.ts`), so both `next build`'s own type-check pass
// and the gate's explicit post-build `tsc --noEmit -p tsconfig.json` see it.

export function ciProofBrokenOnPurpose(): number {
    const notANumber: string = "this is a string, not a number";
    // TS2322: Type 'string' is not assignable to type 'number'.
    const broken: number = notANumber;
    return broken;
}
