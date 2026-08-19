.PHONY: reader-build-lib reader-install reader-dist reader-dist-win reader-dist-mac reader-dev

PNPM ?= pnpm
NPM ?= npm

REPO_ROOT := $(CURDIR)
READER_DIR := $(REPO_ROOT)/reader

reader-build-lib:
	cd $(REPO_ROOT) && $(PNPM) build

reader-install:
	cd $(READER_DIR) && $(NPM) install --ignore-scripts

reader-dist: reader-build-lib reader-install
	cd $(READER_DIR) && $(NPM) run dist

reader-dist-win: reader-build-lib reader-install
	cd $(READER_DIR) && $(NPM) run dist:win

reader-dist-mac: reader-build-lib reader-install
	cd $(READER_DIR) && $(NPM) run dist:mac

reader-dev:
	cd $(READER_DIR) && $(NPM) run dev

