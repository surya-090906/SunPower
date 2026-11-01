// Native React page. Data contract: portal/quote.
import {
  Fragment,
  cssStyle,
  text,
  FieldGroup,
  Field,
  TextArea,
  ActionForm,
  CsrfField,
} from "@ui/runtime";
export default function Page({ data, state }) {
  return (
    <>
      {"\n"}
      <a className={"small"} href={"/portal/p/" + text(data.v1) + "/"}>
        {"‹ Back to project"}
      </a>
      {"\n"}
      <div className={"spread mt-s mb"}>
        <div>
          <h1>{"Your quote"}</h1>
          <div className={"muted small"}>
            {data.v2}
            {" · version "}
            {data.v3}
            {data.choice4 === 0 ? (
              <>
                {" · valid until "}
                {data.v5}
              </>
            ) : null}
          </div>
        </div>
        {"\n  "}
        <span className={"badge " + text(data.v6)}>{data.v7}</span>
      </div>
      {"\n\n"}
      <div className={"pcard"} style={cssStyle("padding:0")}>
        {"\n  "}
        <div className={"tbl-wrap"}>
          <table className={"table"}>
            <thead>
              <tr>
                <th>{"Item"}</th>
                <th className={"num"}>{"Qty"}</th>
                <th className={"num"}>{"Rate"}</th>
                <th className={"num"}>{"Amount"}</th>
              </tr>
            </thead>
            <tbody>
              {data.rows8?.length ? (
                data.rows8.map((row8, index) => (
                  <Fragment key={index}>
                    <tr>
                      <td>{row8.v9}</td>
                      <td className={"num"}>{row8.v10}</td>
                      <td className={"num"}>{row8.v11}</td>
                      <td className={"num"}>{row8.v12}</td>
                    </tr>
                  </Fragment>
                ))
              ) : (
                <></>
              )}
            </tbody>
          </table>
        </div>
        {"\n  "}
        <div style={cssStyle("padding:1rem 1.1rem")}>
          {"\n    "}
          <div className={"spread"}>
            <span className={"muted"}>{"Subtotal"}</span>
            <span>{data.v13}</span>
          </div>
          {"\n    "}
          {data.choice14 === 0 ? (
            <>
              <div className={"spread"}>
                <span className={"muted"}>
                  {"Discount ("}
                  {data.v15}
                  {"%)"}
                </span>
                <span>
                  {"-"}
                  {data.v16}
                </span>
              </div>
            </>
          ) : null}
          {"\n    "}
          <div className={"spread"}>
            <span className={"muted"}>{"GST"}</span>
            <span>{data.v17}</span>
          </div>
          {"\n    "}
          <div
            className={"spread bold"}
            style={cssStyle(
              "font-size:1.15rem;border-top:2px solid var(--ink);margin-top:.4rem;padding-top:.5rem",
            )}
          >
            <span>{"Total"}</span>
            <span>{data.v18}</span>
          </div>
          {"\n  "}
        </div>
        {"\n"}
      </div>
      {"\n\n"}
      {data.choice19 === 0 ? (
        <>
          {"\n"}
          <div className={"banner info mt"}>
            <span className={"ico"}>{"🏛️"}</span>
            <div>
              <div className={"big"}>
                {"Expected subsidy "}
                {data.v20}
              </div>
              {"\n  "}
              <div className={"small"}>
                {
                  "The government pays this to your bank account after commissioning; it is not deducted from this quote. Your net cost after subsidy is about "
                }
                <b>{data.v21}</b>
                {"."}
              </div>
            </div>
          </div>
          {"\n"}
        </>
      ) : null}
      {"\n\n"}
      {data.choice22 === 0 ? (
        <>
          {"\n"}
          <ActionForm method={"post"} className={"pcard mt stack"}>
            <CsrfField />
            {"\n  "}
            <h3>{"Accept this quote"}</h3>
            {"\n  "}
            <p className={"small muted"} style={cssStyle("margin:0")}>
              {"After you accept, pay the advance of "}
              <b>{data.v23}</b>
              {" ("}
              {data.v24}
              {"% of the total) and we schedule your installation."}
            </p>
            {"\n  "}
            <FieldGroup className={"field"}>
              <label htmlFor={"n"}>{"Type your full name to sign"}</label>
              <Field
                id={"n"}
                className={"inp"}
                name={"name"}
                value={text(data.v25)}
                required={true}
              />
            </FieldGroup>
            {"\n  "}
            <label className={"check"}>
              <Field type={"checkbox"} name={"terms"} value={"1"} />
              <span className={"small"}>
                {
                  "I accept this quote and the terms of supply and installation."
                }
              </span>
            </label>
            {"\n  "}
            <button className={"btn btn-primary btn-lg btn-block"}>
              {"Accept quote"}
            </button>
            {"\n"}
          </ActionForm>
          {"\n"}
          <ActionForm method={"post"} className={"pcard mt stack"}>
            <CsrfField />
            <Field type={"hidden"} name={"action"} value={"ask"} />
            {"\n  "}
            <h3>{"Have a question?"}</h3>
            <TextArea
              className={"inp"}
              name={"text"}
              placeholder={"Ask about the equipment, timing or price"}
            ></TextArea>
            <button className={"btn btn-line"}>{"Send question"}</button>
            {"\n"}
          </ActionForm>
          {"\n"}
        </>
      ) : data.choice22 === 1 ? (
        <>
          {"\n"}
          <div className={"banner ok mt"}>
            <span className={"ico"}>{"✓"}</span>
            <div>
              <div className={"big"}>
                {"You accepted this quote"}
                {data.choice26 === 0 ? (
                  <>
                    {" on "}
                    {data.v27}
                  </>
                ) : null}
              </div>
              {"\n  "}
              {data.choice28 === 0 ? (
                <>
                  <a
                    className={"btn btn-primary mt-s"}
                    href={"/portal/p/" + text(data.v29) + "/pay/"}
                  >
                    {"Pay the advance"}
                  </a>
                </>
              ) : null}
            </div>
          </div>
          {"\n"}
        </>
      ) : null}
      {"\n"}
      <p className={"center mt"}>
        <a
          className={"btn btn-line btn-sm"}
          href={"/doc/quote/" + text(data.v30) + "/"}
        >
          {"Print or save as PDF"}
        </a>
      </p>
      {"\n"}
    </>
  );
}
