.PHONY: libro matlab figuras cobertura clean

libro:
	latexmk -pdf -interaction=nonstopmode -halt-on-error main.tex

matlab:
	matlab -batch "run('matlab/run_all.m')"

figuras: matlab
	@echo "Figuras MATLAB regeneradas en figuras/matlab/."

cobertura:
	@bash scripts/verificar_cobertura.sh

clean:
	latexmk -c main.tex
	rm -f main.bbl main.run.xml *.glo *.gls *.glg *.ist *.acn *.acr *.alg
