// Native React page. Data contract: portal/project.
import {
  Fragment,
  cssStyle,
  text,
  Field,
  TextArea,
  SelectField,
  ActionForm,
  CsrfField,
  Partial,
} from "@ui/runtime";
export default function Page({ data, state }) {
  return (
    <>
      {"\n"}
      <a className={"small"} href={"/portal/"}>
        {"‹ All projects"}
      </a>
      {"\n"}
      <div className={"spread mt-s mb"}>
        <div>
          <h1>{data.v1}</h1>
          <div className={"muted small"}>
            {data.v2}
            {" · "}
            {data.v3}
          </div>
        </div>
        <span className={"badge " + text(data.v4)}>{data.v5}</span>
      </div>
      {"\n"}
      {data.choice6 === 0 ? (
        <>
          <p className={"small mb"}>
            <a href={text(data.v7)} target={"_blank"} rel={"noopener"}>
              {"View installation location on map"}
            </a>
          </p>
        </>
      ) : null}
      {"\n\n"}
      <div className={"next mb"}>
        <div className={"lbl"}>{"What happens next"}</div>
        {"\n  "}
        <p
          style={cssStyle(
            "margin:.3rem 0 " +
              (data.choice8 === 0 ? ".7rem" : data.choice8 === 1 ? "0" : "") +
              ";font-weight:600",
          )}
        >
          {data.v9}
        </p>
        {"\n  "}
        {data.choice10 === 0 ? (
          <>
            <a className={"btn btn-primary"} href={text(data.v11)}>
              {data.v12}
            </a>
          </>
        ) : null}
      </div>
      {"\n\n"}
      <div className={"stack"}>
        {"\n"}
        {data.choice13 === 0 ? (
          <>
            {"\n"}
            <div className={"pcard"}>
              <h3>{"Site survey visit"}</h3>
              {"\n  "}
              <p className={"mt-s"} style={cssStyle("margin-bottom:.4rem")}>
                <b>{data.v14}</b>
                {data.choice15 === 0 ? (
                  <>
                    {" · "}
                    {data.v16}
                    {data.choice17 === 0 ? (
                      <>
                        {" · "}
                        <a href={"tel:" + text(data.v18)}>{data.v19}</a>
                      </>
                    ) : null}
                  </>
                ) : null}
              </p>
              {"\n  "}
              {data.choice20 === 0 ? (
                <>
                  <span className={"badge b-green"}>
                    {"You confirmed this date"}
                  </span>
                  {"\n  "}
                </>
              ) : data.choice20 === 1 ? (
                <>
                  <ActionForm
                    method={"post"}
                    action={"/portal/p/" + text(data.v21) + "/slot/survey/"}
                  >
                    <CsrfField />
                    <Field type={"hidden"} name={"action"} value={"confirm"} />
                    <button className={"btn btn-ok"}>
                      {"Confirm this date"}
                    </button>
                  </ActionForm>
                </>
              ) : null}
              {"\n  "}
              {data.choice22 === 0 ? (
                <>
                  <p className={"small muted mt-s"}>
                    {'Your request: "'}
                    {data.v23}
                    {'"'}
                  </p>
                </>
              ) : null}
              {"\n  "}
              <details className={"mt-s"}>
                <summary
                  className={"small muted"}
                  style={cssStyle("cursor:pointer")}
                >
                  {"Need a different time?"}
                </summary>
                {"\n    "}
                <ActionForm
                  method={"post"}
                  action={"/portal/p/" + text(data.v24) + "/slot/survey/"}
                  className={"stack mt-s"}
                >
                  <CsrfField />
                  <Field type={"hidden"} name={"action"} value={"reschedule"} />
                  <TextArea
                    className={"inp"}
                    name={"note"}
                    placeholder={"Which day or time suits you better?"}
                  ></TextArea>
                  <button className={"btn btn-line btn-sm"}>
                    {"Send request"}
                  </button>
                </ActionForm>
              </details>
              {"\n"}
            </div>
            {"\n"}
          </>
        ) : null}
        {"\n\n"}
        {data.choice25 === 0 ? (
          <>
            {"\n"}
            <div className={"pcard"}>
              <h3>{"Installation"}</h3>
              {"\n  "}
              <p className={"mt-s"} style={cssStyle("margin-bottom:.4rem")}>
                <b>{data.v26}</b>
              </p>
              {"\n  "}
              {data.choice27 === 0 ? (
                <>
                  <p className={"small muted"}>
                    {"Your crew: "}
                    {data.rows28?.length ? (
                      data.rows28.map((row28, index) => (
                        <Fragment key={index}>
                          {row28.v29}
                          {row28.choice30 === 0 ? <>{", "}</> : null}
                        </Fragment>
                      ))
                    ) : (
                      <></>
                    )}
                    {data.choice31 === 0 ? (
                      <>
                        {" · lead "}
                        <a href={"tel:" + text(data.v32)}>{data.v33}</a>
                      </>
                    ) : null}
                  </p>
                </>
              ) : null}
              {"\n  "}
              {data.choice34 === 0 ? (
                <>
                  <span className={"badge b-green"}>
                    {"You confirmed this date"}
                  </span>
                  {"\n  "}
                </>
              ) : data.choice34 === 1 ? (
                <>
                  <ActionForm
                    method={"post"}
                    action={"/portal/p/" + text(data.v35) + "/slot/install/"}
                  >
                    <CsrfField />
                    <Field type={"hidden"} name={"action"} value={"confirm"} />
                    <button className={"btn btn-ok"}>
                      {"Confirm this date"}
                    </button>
                  </ActionForm>
                </>
              ) : null}
              {"\n  "}
              {data.choice36 === 0 ? (
                <>
                  <p className={"small muted mt-s"}>
                    {'Your request: "'}
                    {data.v37}
                    {'"'}
                  </p>
                </>
              ) : null}
              {"\n  "}
              <details className={"mt-s"}>
                <summary
                  className={"small muted"}
                  style={cssStyle("cursor:pointer")}
                >
                  {"Need a different day?"}
                </summary>
                {"\n    "}
                <ActionForm
                  method={"post"}
                  action={"/portal/p/" + text(data.v38) + "/slot/install/"}
                  className={"stack mt-s"}
                >
                  <CsrfField />
                  <Field type={"hidden"} name={"action"} value={"reschedule"} />
                  <TextArea
                    className={"inp"}
                    name={"note"}
                    placeholder={"Which day suits you better?"}
                  ></TextArea>
                  <button className={"btn btn-line btn-sm"}>
                    {"Send request"}
                  </button>
                </ActionForm>
              </details>
              {"\n"}
            </div>
            {"\n"}
          </>
        ) : null}
        {"\n\n"}
        {data.choice39 === 0 ? (
          <>
            {"\n"}
            <div
              className={"pcard"}
              style={cssStyle(
                "border-left:4px solid var(--brand);background:var(--brand-soft)",
              )}
            >
              {"\n  "}
              <h3>{"Confirm installation"}</h3>
              {"\n  "}
              <p className={"small muted mt-s"}>
                {
                  "Your rooftop solar system has been installed and tested. Please confirm that the work looks good so we can finalize your handover documentation and warranty certificate."
                }
              </p>
              {"\n  "}
              <ActionForm
                method={"post"}
                action={text(data.v40)}
                className={"mt"}
              >
                {"\n    "}
                <CsrfField />
                {"\n    "}
                <button className={"btn btn-primary btn-block"}>
                  {"✓ Confirm installation looks good"}
                </button>
                {"\n  "}
              </ActionForm>
              {"\n"}
            </div>
            {"\n"}
          </>
        ) : null}
        {"\n\n"}
        <div className={"pcard"}>
          <h3 className={"mb-s"}>{"Progress"}</h3>
          <Partial part={data.part41} state={state} />
        </div>
        {"\n\n"}
        <div className={"pcard"}>
          <h3 className={"mb-s"}>{"Documents"}</h3>
          {"\n  "}
          <div className={"stack small"}>
            {"\n    "}
            {data.choice42 === 0 ? (
              <>
                <div className={"spread"}>
                  <span>
                    {"Quote v"}
                    {data.v43}
                    {" · "}
                    {data.v44}
                  </span>
                  <a href={"/portal/p/" + text(data.v45) + "/quote/"}>
                    {"View"}
                  </a>
                </div>
              </>
            ) : null}
            {"\n    "}
            {data.rows46?.length ? (
              data.rows46.map((row46, index) => (
                <Fragment key={index}>
                  {row46.choice47 === 0 ? (
                    <>
                      <div className={"spread"}>
                        <span>
                          {"Receipt · "}
                          {row46.v48}
                          {" · "}
                          {row46.v49}
                        </span>
                        <a href={"/doc/receipt/" + text(row46.v50) + "/"}>
                          {"Open"}
                        </a>
                      </div>
                    </>
                  ) : null}
                </Fragment>
              ))
            ) : (
              <></>
            )}
            {"\n    "}
            {data.rows51?.length ? (
              data.rows51.map((row51, index) => (
                <Fragment key={index}>
                  <div className={"spread"}>
                    <span>
                      {"Invoice "}
                      {row51.v52}
                      {" · "}
                      {row51.v53}
                    </span>
                    <span>
                      <span className={"badge " + text(row51.v54)}>
                        {row51.v55}
                      </span>{" "}
                      <a href={"/doc/invoice/" + text(row51.v56) + "/"}>
                        {"Open"}
                      </a>
                    </span>
                  </div>
                </Fragment>
              ))
            ) : (
              <></>
            )}
            {"\n    "}
            {data.choice57 === 0 ? (
              <>
                <div className={"spread"}>
                  <span>
                    {"Delivery note "}
                    {data.v58}
                    {" (with serial numbers)"}
                  </span>
                  <a href={"/doc/delivery/" + text(data.v59) + "/"}>{"Open"}</a>
                </div>
              </>
            ) : null}
            {"\n    "}
            {data.choice60 === 0 ? (
              <>
                <div className={"spread"}>
                  <span>{"Handover certificate"}</span>
                  <a href={"/doc/handover/" + text(data.v61) + "/"}>{"Open"}</a>
                </div>
              </>
            ) : null}
            {"\n    "}
            {data.choice62 === 0 ? (
              <>
                <div className={"spread"}>
                  <span>{"Warranty card"}</span>
                  <a href={"/doc/warranty/" + text(data.v63) + "/"}>{"Open"}</a>
                </div>
              </>
            ) : null}
            {"\n    "}
            {data.choice64 === 0 ? (
              <>
                <span className={"muted"}>
                  {"Documents appear here as your project moves forward."}
                </span>
              </>
            ) : null}
            {"\n  "}
          </div>
          {"\n"}
        </div>
        {"\n\n"}
        <div className={"pcard"}>
          {"\n  "}
          <div className={"spread mb-s"}>
            {"\n    "}
            <div>
              {"\n      "}
              <h3 style={cssStyle("margin:0")}>{"Subsidy & KYC Documents"}</h3>
              {"\n      "}
              <p className={"small muted"} style={cssStyle("margin:2px 0 0")}>
                {"Upload required papers for PM Surya Ghar / DISCOM approvals"}
              </p>
              {"\n    "}
            </div>
            {"\n    "}
            {data.choice65 === 0 ? (
              <>
                <span className={"badge b-green"}>{"Subsidy eligible"}</span>
              </>
            ) : null}
            {"\n  "}
          </div>
          {"\n  "}
          {data.choice66 === 0 ? (
            <>
              {"\n  "}
              <div className={"stack small mb-s"}>
                {"\n    "}
                {data.rows67?.length ? (
                  data.rows67.map((row67, index) => (
                    <Fragment key={index}>
                      {"\n      "}
                      <div
                        className={"spread"}
                        style={cssStyle(
                          "padding:.25rem 0;border-bottom:1px solid var(--line)",
                        )}
                      >
                        {"\n        "}
                        <span>
                          <b>{row67.v68}</b>{" "}
                          <span className={"muted font-mono"}>
                            {"("}
                            {row67.v69}
                            {")"}
                          </span>
                        </span>
                        {"\n        "}
                        <a
                          className={"small"}
                          href={text(row67.v70)}
                          target={"_blank"}
                        >
                          {"View file"}
                        </a>
                        {"\n      "}
                      </div>
                      {"\n    "}
                    </Fragment>
                  ))
                ) : (
                  <></>
                )}
                {"\n  "}
              </div>
              {"\n  "}
            </>
          ) : null}
          {"\n  "}
          <ActionForm
            method={"post"}
            action={"/portal/p/" + text(data.v71) + "/upload/"}
            enctype={"multipart/form-data"}
            className={"stack mt-s"}
            style={cssStyle(
              "background:var(--bg);padding:.6rem .8rem;border-radius:6px;border:1px solid var(--line)",
            )}
          >
            {"\n    "}
            <CsrfField />
            {"\n    "}
            <div className={"row"} style={cssStyle("gap:.5rem;flex-wrap:wrap")}>
              {"\n      "}
              <SelectField
                className={"inp inp-sm"}
                name={"doc_type"}
                style={cssStyle("width:auto;flex-grow:1")}
              >
                {"\n        "}
                <option value={"bill"}>{"Electricity Bill (latest)"}</option>
                {"\n        "}
                <option value={"aadhaar"}>{"ID Proof (Aadhaar/PAN)"}</option>
                {"\n        "}
                <option value={"bank"}>{"Bank Passbook / Cheque"}</option>
                {"\n        "}
                <option value={"roof"}>{"Roof Photograph"}</option>
                {"\n      "}
              </SelectField>
              {"\n      "}
              <Field
                type={"file"}
                name={"file"}
                className={"inp inp-sm"}
                required={true}
                style={cssStyle("width:auto;flex-grow:2")}
              />
              {"\n      "}
              <button className={"btn btn-primary btn-sm"}>{"Upload"}</button>
              {"\n    "}
            </div>
            {"\n  "}
          </ActionForm>
          {"\n"}
        </div>
        {"\n\n"}
        {data.choice72 === 0 ? (
          <>
            <div className={"pcard"}>
              <h3 className={"mb-s"}>{"Payments"}</h3>
              {"\n  "}
              {data.rows73?.length ? (
                data.rows73.map((row73, index) => (
                  <Fragment key={index}>
                    <div
                      className={"spread small"}
                      style={cssStyle("padding:.3rem 0")}
                    >
                      <span>
                        {row73.v74}
                        {" · "}
                        {row73.v75}
                        {row73.choice76 === 0 ? (
                          <>
                            {" · "}
                            {row73.v77}
                          </>
                        ) : null}
                      </span>
                      <span>
                        <b>{row73.v78}</b>{" "}
                        <span className={"badge " + text(row73.v79)}>
                          {row73.v80}
                        </span>
                      </span>
                    </div>
                  </Fragment>
                ))
              ) : (
                <></>
              )}
              {"\n"}
            </div>
          </>
        ) : null}
        {"\n\n"}
        {data.choice81 === 0 ? (
          <>
            <div className={"pcard spread"}>
              <div>
                <h3>{"Something not working?"}</h3>
                <p className={"small muted"} style={cssStyle("margin:0")}>
                  {"See your warranty or raise a service request."}
                </p>
              </div>
              <span className={"row"}>
                <a className={"btn btn-line btn-sm"} href={"/portal/systems/"}>
                  {"My systems"}
                </a>
                <a
                  className={"btn btn-dark btn-sm"}
                  href={"/portal/requests/new/"}
                >
                  {"Report a problem"}
                </a>
              </span>
            </div>
          </>
        ) : null}
        {"\n\n"}
        <div className={"pcard"}>
          <h3 className={"mb-s"}>{"Updates"}</h3>
          {"\n  "}
          <ul className={"tl"}>
            {data.rows82?.length ? (
              data.rows82.map((row82, index) => (
                <Fragment key={index}>
                  <li>
                    <span className={"when"}>{row82.v83}</span>
                    <span className={"what"}>{row82.v84}</span>
                  </li>
                </Fragment>
              ))
            ) : (
              <>
                <li className={"muted"}>{"No updates yet."}</li>
              </>
            )}
          </ul>
          {"\n"}
        </div>
        {"\n"}
      </div>
      {"\n"}
    </>
  );
}
