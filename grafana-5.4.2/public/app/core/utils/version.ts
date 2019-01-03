import _ from 'lodash';

const versionPattern = /^(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:-([0-9A-Za-z\.]+))?/;

export class SemVersion {
  major: number;
  minor: number;
  patch: number;
  meta: string;

  constructor(version: string) {
    const match = versionPattern.exec(version);
    if (match) {
      this.major = Number(match[1]);
      this.minor = Number(match[2] || 0);
      this.patch = Number(match[3] || 0);
      this.meta = match[4];
    }
  }

  isGtOrEq(version: string): boolean {
    const compared = new SemVersion(version);
    return !(this.major < compared.major || this.minor < compared.minor || this.patch < compared.patch);
  }

  isValid(): boolean {
    return _.isNumber(this.major);
  }
}

export function isVersionGtOrEq(a: string, b: string): boolean {
  const aSemver = new SemVersion(a);
  return aSemver.isGtOrEq(b);
}
