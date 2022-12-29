SOURCE_DIR=source
OUT_DIR=out

RM=rm
RSYNC=rsync

TSC=tsc
TSC_FLAGS=--noEmitOnError --strict --noFallthroughCasesInSwitch --noImplicitAny --noImplicitOverride --noImplicitReturns --noImplicitThis --noUnusedLocals --noUnusedParameters

build:
	$(RSYNC) -au --exclude='*.ts' $(SOURCE_DIR)/. $(OUT_DIR)
	$(TSC) $(TSC_FLAGS)

clean:
	$(RM) -rf out