.PHONY: build typecheck lint test start dev format format-check clean

PNPM ?= pnpm

build:
	$(PNPM) build

typecheck:
	$(PNPM) typecheck

lint:
	$(PNPM) lint

test:
	$(PNPM) test

start:
	$(PNPM) start

dev:
	$(PNPM) dev

format:
	$(PNPM) format

format-check:
	$(PNPM) format:check

clean:
	rm -rf dist

include reader/Makefile
